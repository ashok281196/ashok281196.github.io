// Chapter 11 · Monads
// Build: g++ -std=c++23 -O2 -Wall ch11.cpp -o ch11 && ./ch11
#include <cassert>
#include <functional>
#include <iostream>
#include <optional>
#include <string>
#include <utility>
#include <vector>

// =====================================================================
// Abstracting over a type constructor F<_>.
// C++ has no "F[_]" parameter that works for every template, so we use
// the standard trick: a tag type with a nested alias template.
// =====================================================================
struct OptionalK { template <typename A> using F = std::optional<A>; };
struct VectorK   { template <typename A> using F = std::vector<A>; };

template <typename A> struct Id { A value; using value_type = A; bool operator==(const Id&) const = default; };
struct IdK       { template <typename A> using F = Id<A>; };

template <typename S, typename A>
struct State {
    using value_type = A;
    std::function<std::pair<A, S>(S)> run;
};
template <typename S> struct StateK { template <typename A> using F = State<S, A>; };

template <typename R, typename A>
struct Reader {
    using value_type = A;
    std::function<A(const R&)> run;
};
template <typename R> struct ReaderK { template <typename A> using F = Reader<R, A>; };

// ---- the type class: one primary template, one specialisation per type ----------
template <typename K> struct Monad;   // unit(a) and flat_map(fa, f) for each K

template <> struct Monad<OptionalK> {
    template <typename A> static std::optional<A> unit(A a) { return a; }
    template <typename A, typename Fn> static auto flat_map(const std::optional<A>& fa, Fn f) { return fa.and_then(f); }
};
template <> struct Monad<VectorK> {
    template <typename A> static std::vector<A> unit(A a) { return {a}; }
    template <typename A, typename Fn> static auto flat_map(const std::vector<A>& fa, Fn f) {
        std::invoke_result_t<Fn, const A&> out;
        for (const auto& a : fa) { auto bs = f(a); out.insert(out.end(), bs.begin(), bs.end()); }
        return out;
    }
};
template <> struct Monad<IdK> {
    template <typename A> static Id<A> unit(A a) { return {a}; }
    template <typename A, typename Fn> static auto flat_map(const Id<A>& fa, Fn f) { return f(fa.value); }
};
template <typename S> struct Monad<StateK<S>> {
    template <typename A> static State<S, A> unit(A a) { return {[a](S s) { return std::pair{a, s}; }}; }
    template <typename A, typename Fn> static auto flat_map(const State<S, A>& fa, Fn f) {
        using SB = std::invoke_result_t<Fn, A>;
        return SB{[fa, f](S s) { auto [a, s1] = fa.run(s); return f(a).run(s1); }};
    }
};
template <typename R> struct Monad<ReaderK<R>> {
    template <typename A> static Reader<R, A> unit(A a) { return {[a](const R&) { return a; }}; }
    template <typename A, typename Fn> static auto flat_map(const Reader<R, A>& fa, Fn f) {
        using RB = std::invoke_result_t<Fn, A>;
        return RB{[fa, f](const R& r) { return f(fa.run(r)).run(r); }};   // the same r goes to every step
    }
};

// =====================================================================
// Derived combinators: written ONCE, for every monad
// =====================================================================
template <typename K, typename FA, typename Fn>
auto map(const FA& fa, Fn f) {
    using A = typename FA::value_type;
    using B = std::invoke_result_t<Fn, const A&>;
    return Monad<K>::flat_map(fa, [f](const A& a) { return Monad<K>::template unit<B>(f(a)); });
}

template <typename K, typename FA, typename FB, typename Fn>
auto map2(const FA& fa, const FB& fb, Fn f) {
    using A = typename FA::value_type;
    using B = typename FB::value_type;
    return Monad<K>::flat_map(fa, [fb, f](const A& a) {
        return map<K>(fb, [a, f](const B& b) { return f(a, b); });
    });
}

template <typename K, typename A, typename Fn>
auto traverse(const std::vector<A>& as, Fn f) {
    using FB = std::invoke_result_t<Fn, const A&>;
    using B = typename FB::value_type;
    using FVec = typename K::template F<std::vector<B>>;
    FVec acc = Monad<K>::template unit<std::vector<B>>({});
    for (auto it = as.rbegin(); it != as.rend(); ++it)
        acc = map2<K>(f(*it), acc, [](const B& b, std::vector<B> v) { v.insert(v.begin(), b); return v; });
    return acc;
}

template <typename K, typename FA>
auto sequence(const std::vector<FA>& fas) { return traverse<K>(fas, [](const FA& fa) { return fa; }); }

template <typename K, typename FA>
auto replicate_m(int n, const FA& fa) { return sequence<K>(std::vector<FA>(n, fa)); }

// Kleisli composition: (A -> F<B>, B -> F<C>) -> (A -> F<C>)
template <typename K, typename F1, typename F2>
auto compose(F1 f, F2 g) {
    return [f, g](const auto& a) { return Monad<K>::flat_map(f(a), g); };
}

template <typename K, typename FFA>
auto join(const FFA& ffa) {
    using FA = typename FFA::value_type;
    return Monad<K>::flat_map(ffa, [](const FA& fa) { return fa; });
}

// ---- Reader in use ---------------------------------------------------------------
struct Config { std::string base_url; int retries; };
Reader<Config, Config> ask() { return {[](const Config& c) { return c; }}; }

int main() {
    using M = Monad<OptionalK>;
    auto half = [](int x) -> std::optional<int> { if (x % 2) return std::nullopt; return x / 2; };

    // derived functions work for optional...
    assert((*sequence<OptionalK>(std::vector<std::optional<int>>{1, 2}) == std::vector{1, 2}));
    assert(!sequence<OptionalK>(std::vector<std::optional<int>>{1, std::nullopt}));
    assert((*map2<OptionalK>(std::optional{2}, std::optional{3}, std::plus{}) == 5));
    assert((*traverse<OptionalK>(std::vector{2, 4}, half) == std::vector{1, 2}));

    // ...and for vector, where replicate_m means "every combination"
    auto combos = replicate_m<VectorK>(2, std::vector{0, 1});
    assert((combos == std::vector<std::vector<int>>{{0, 0}, {0, 1}, {1, 0}, {1, 1}}));

    // ...and for State
    using SK = StateK<int>;
    State<int, int> tick{[](int s) { return std::pair{s, s + 1}; }};
    auto three = replicate_m<SK>(3, tick).run(10);
    assert((three.first == std::vector{10, 11, 12}) && three.second == 13);

    // ...and for Id: plain sequencing
    auto hello = Monad<IdK>::flat_map(Id<std::string>{"Hello, "}, [](const std::string& a) {
        return map<IdK>(Id<std::string>{"monad!"}, [a](const std::string& b) { return a + b; }); });
    assert(hello.value == "Hello, monad!");

    // the monad laws, checked on a few values
    auto f = half;
    auto g = [](int x) -> std::optional<int> { return x > 0 ? std::optional{x - 1} : std::nullopt; };
    auto h = [](int x) -> std::optional<int> { return x * 3; };
    for (int x : {0, 1, 2, 4, 8, 12}) {
        auto unit = [](int a) { return M::unit(a); };
        assert(compose<OptionalK>(compose<OptionalK>(f, g), h)(x) == compose<OptionalK>(f, compose<OptionalK>(g, h))(x));
        assert(compose<OptionalK>(f, unit)(x) == f(x));     // right identity
        assert(compose<OptionalK>(unit, f)(x) == f(x));     // left identity
    }
    assert((*join<OptionalK>(std::optional<std::optional<int>>(std::optional<int>(7))) == 7));   // note: std::optional{std::optional{7}} would deduce optional<int>
    assert((join<VectorK>(std::vector<std::vector<int>>{{1}, {2, 3}}) == std::vector{1, 2, 3}));

    // Reader: dependency injection without a framework
    using RK = ReaderK<Config>;
    auto endpoint = map<RK>(ask(), [](const Config& c) {
        return c.base_url + "/v1/data?retries=" + std::to_string(c.retries); });
    assert(endpoint.run(Config{"https://api.example.com", 3}) == "https://api.example.com/v1/data?retries=3");

    std::cout << "ch11 ok\n";
}
