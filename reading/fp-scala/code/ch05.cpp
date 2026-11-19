// Chapter 5 · Strictness & Laziness
// Build: g++ -std=c++23 -O2 -Wall ch05.cpp -o ch05 && ./ch05
#include <cassert>
#include <functional>
#include <iostream>
#include <memory>
#include <optional>
#include <ranges>
#include <string>
#include <utility>
#include <vector>

// ---- non-strict functions -------------------------------------------------
template <typename A>
A if2(bool cond, const std::function<A()>& on_true, const std::function<A()>& on_false) {
    return cond ? on_true() : on_false();          // only one thunk is ever called
}

int calls = 0;
int maybe_twice(bool b, const std::function<int()>& i) { return b ? i() + i() : 0; }   // evaluates twice

// a memoised thunk: evaluate at most once
template <typename T>
class Lazy {
    mutable std::function<T()> f_;
    mutable std::optional<T> v_;
public:
    explicit Lazy(std::function<T()> f) : f_(std::move(f)) {}
    const T& get() const {
        if (!v_) { v_ = f_(); f_ = nullptr; }      // not thread-safe; see std::call_once
        return *v_;
    }
};
int maybe_twice2(bool b, const std::function<int()>& i) {
    Lazy<int> j(i);
    return b ? j.get() + j.get() : 0;              // evaluated once
}

// ---- a lazy, memoised list ------------------------------------------------
template <typename T>
class LazyList {
public:
    using Step = std::optional<std::pair<T, LazyList>>;   // nothing, or (head, rest)
private:
    struct Node {
        std::function<Step()> thunk;
        std::optional<Step> memo;
    };
    std::shared_ptr<Node> n_;
public:
    explicit LazyList(std::function<Step()> f)
        : n_(std::make_shared<Node>(Node{std::move(f), std::nullopt})) {}
    LazyList() : LazyList([] { return Step{}; }) {}             // empty

    // force one step: compute (head, rest) at most once
    const Step& step() const {
        if (!n_->memo) { n_->memo = n_->thunk(); n_->thunk = nullptr; }
        return *n_->memo;
    }
    template <typename F>                                        // tail is a thunk: () -> LazyList
    static LazyList cons(T h, F tail) {
        return LazyList([h = std::move(h), tail]() -> Step { return std::pair{h, tail()}; });
    }
};

template <typename T> LazyList<T> lazy_of(std::vector<T> v, size_t i = 0) {
    return LazyList<T>([v = std::move(v), i]() -> typename LazyList<T>::Step {
        if (i >= v.size()) return std::nullopt;
        return std::pair{v[i], lazy_of(v, i + 1)};
    });
}

template <typename T> std::vector<T> to_vector(LazyList<T> ll) {
    std::vector<T> out;
    while (const auto& s = ll.step()) { out.push_back(s->first); auto next = s->second; ll = next; }
    return out;
}

// Exercise 5.1
template <typename T> LazyList<T> take(LazyList<T> ll, int n) {
    return LazyList<T>([ll, n]() -> typename LazyList<T>::Step {
        if (n <= 0) return std::nullopt;
        const auto& s = ll.step();
        if (!s) return std::nullopt;
        return std::pair{s->first, take(s->second, n - 1)};
    });
}
template <typename T, typename P> LazyList<T> take_while(LazyList<T> ll, P p) {
    return LazyList<T>([ll, p]() -> typename LazyList<T>::Step {
        const auto& s = ll.step();
        if (!s || !p(s->first)) return std::nullopt;
        return std::pair{s->first, take_while(s->second, p)};
    });
}

// ---- a lazy right fold: the rest of the fold is passed as a thunk ----------
template <typename T, typename B, typename F>
B fold_right(LazyList<T> ll, std::function<B()> acc, F f) {
    const auto& s = ll.step();
    if (!s) return acc();
    auto rest = s->second;
    return f(s->first, std::function<B()>([rest, acc, f] { return fold_right<T, B, F>(rest, acc, f); }));
}

template <typename T, typename P> bool exists(LazyList<T> ll, P p) {
    return fold_right<T, bool>(ll, [] { return false; },
        [&p](const T& a, const std::function<bool()>& rest) { return p(a) || rest(); });   // || stops early
}

// Exercise 5.2
template <typename T, typename P> bool for_all(LazyList<T> ll, P p) {
    return fold_right<T, bool>(ll, [] { return true; },
        [&p](const T& a, const std::function<bool()>& rest) { return p(a) && rest(); });
}

template <typename T, typename F>
auto map(LazyList<T> ll, F f) -> LazyList<std::invoke_result_t<F, const T&>> {
    using U = std::invoke_result_t<F, const T&>;
    return LazyList<U>([ll, f]() -> typename LazyList<U>::Step {
        const auto& s = ll.step();
        if (!s) return std::nullopt;
        return std::pair{f(s->first), map(s->second, f)};
    });
}
template <typename T, typename P> LazyList<T> filter(LazyList<T> ll, P p) {
    return LazyList<T>([ll, p]() -> typename LazyList<T>::Step {
        LazyList<T> cur = ll;
        while (const auto& s = cur.step()) {            // skip non-matching elements in a loop
            if (p(s->first)) return std::pair{s->first, filter(s->second, p)};
            auto next = s->second; cur = next;
        }
        return std::nullopt;
    });
}
template <typename T> LazyList<T> append(LazyList<T> a, std::function<LazyList<T>()> b) {
    return LazyList<T>([a, b]() -> typename LazyList<T>::Step {
        const auto& s = a.step();
        if (!s) return b().step();
        return std::pair{s->first, append(s->second, b)};
    });
}
template <typename T, typename F>
auto flat_map(LazyList<T> ll, F f) -> std::invoke_result_t<F, const T&> {
    using U = typename std::invoke_result_t<F, const T&>::Step::value_type::first_type;
    return LazyList<U>([ll, f]() -> typename LazyList<U>::Step {
        const auto& s = ll.step();
        if (!s) return std::nullopt;
        auto rest = s->second;
        return append<U>(f(s->first), [rest, f] { return flat_map(rest, f); }).step();   // copies the step out
    });
}
template <typename T, typename P> std::optional<T> find(LazyList<T> ll, P p) {
    auto matches = filter(ll, p);
    const auto& s = matches.step();
    return s ? std::optional<T>(s->first) : std::nullopt;
}

// ---- infinite lists and unfold ----------------------------------------------
template <typename A, typename S, typename F>
LazyList<A> unfold(S state, F f) {           // f: S -> optional<pair<A, S>>
    return LazyList<A>([state, f]() -> typename LazyList<A>::Step {
        auto r = f(state);
        if (!r) return std::nullopt;
        return std::pair{r->first, unfold<A>(r->second, f)};
    });
}

LazyList<int> from(int n) {
    return LazyList<int>::cons(n, [n] { return from(n + 1); });
}
template <typename A> LazyList<A> continually(A a) {
    return unfold<A>(a, [](A s) { return std::optional{std::pair{s, s}}; });
}
LazyList<long> fibs() {
    return unfold<long>(std::pair{0L, 1L}, [](std::pair<long, long> s) {
        return std::optional{std::pair{s.first, std::pair{s.second, s.first + s.second}}};
    });
}

// Exercise 5.4
template <typename T, typename F> auto map_via_unfold(LazyList<T> ll, F f) {
    using U = std::invoke_result_t<F, const T&>;
    return unfold<U>(ll, [f](LazyList<T> cur) -> std::optional<std::pair<U, LazyList<T>>> {
        const auto& s = cur.step();
        if (!s) return std::nullopt;
        return std::pair{f(s->first), s->second};
    });
}
template <typename T> LazyList<T> take_via_unfold(LazyList<T> ll, int n) {
    return unfold<T>(std::pair{ll, n}, [](std::pair<LazyList<T>, int> st)
                     -> std::optional<std::pair<T, std::pair<LazyList<T>, int>>> {
        if (st.second <= 0) return std::nullopt;
        const auto& s = st.first.step();
        if (!s) return std::nullopt;
        return std::pair{s->first, std::pair{s->second, st.second - 1}};
    });
}

int main() {
    // non-strictness
    assert(if2<int>(false, [] () -> int { throw 1; }, [] { return 3; }) == 3);
    calls = 0;
    assert(maybe_twice(true, [] { ++calls; return 42; }) == 84 && calls == 2);
    calls = 0;
    assert(maybe_twice2(true, [] { ++calls; return 42; }) == 84 && calls == 1);

    auto xs = lazy_of(std::vector{1, 2, 3, 4});
    assert((to_vector(take(xs, 2)) == std::vector{1, 2}));
    assert((to_vector(take_while(xs, [](int x) { return x < 3; })) == std::vector{1, 2}));
    assert(exists(xs, [](int x) { return x == 2; }) && !for_all(xs, [](int x) { return x < 3; }));

    // trace: each element flows through the whole pipeline before the next one is touched
    std::vector<std::string> trace;
    auto pipeline = filter(map(xs, [&](int x) { trace.push_back("map " + std::to_string(x)); return x + 10; }),
                           [&](int x) { trace.push_back("filter " + std::to_string(x)); return x % 2 == 0; });
    assert(trace.empty());                                    // nothing ran yet
    assert((to_vector(pipeline) == std::vector{12, 14}));
    assert((trace == std::vector<std::string>{"map 1", "filter 11", "map 2", "filter 12",
                                             "map 3", "filter 13", "map 4", "filter 14"}));

    assert((to_vector(append<int>(take(xs, 1), [] { return lazy_of(std::vector{9}); })) == std::vector{1, 9}));
    assert((to_vector(flat_map(take(xs, 2), [](int x) { return lazy_of(std::vector{x, x}); })) == std::vector{1, 1, 2, 2}));

    // infinite lists
    auto ones = continually(1);
    assert((to_vector(take(ones, 3)) == std::vector{1, 1, 1}));
    assert(exists(ones, [](int x) { return x % 2 != 0; }));
    assert((to_vector(take(from(5), 3)) == std::vector{5, 6, 7}));
    assert((to_vector(take(fibs(), 7)) == std::vector<long>{0, 1, 1, 2, 3, 5, 8}));
    assert(*find(from(1), [](int x) { return x * x > 50; }) == 8);
    assert((to_vector(take_via_unfold(map_via_unfold(from(1), [](int x) { return x * 2; }), 3)) == std::vector{2, 4, 6}));

    // the standard-library version of the same idea: lazy, fused range pipelines
    auto r = std::views::iota(1)
           | std::views::transform([](int x) { return x + 10; })
           | std::views::filter([](int x) { return x % 2 == 0; })
           | std::views::take(2);
    std::vector<int> out;
    for (int x : r) out.push_back(x);
    assert((out == std::vector{12, 14}));

    std::cout << "ch05 ok\n";
}
