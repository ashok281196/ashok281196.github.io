// Chapter 6 · Purely Functional State
// Build: g++ -std=c++23 -O2 -Wall ch06.cpp -o ch06 && ./ch06
#include <cassert>
#include <climits>
#include <cstdint>
#include <functional>
#include <iostream>
#include <tuple>
#include <utility>
#include <variant>
#include <vector>

// ---- a pure random number generator ----------------------------------------
struct RNG {
    std::uint64_t seed;
    // a linear congruential generator with the same constants as java.util.Random
    // (unsigned arithmetic: signed overflow would be undefined behaviour)
    std::pair<int, RNG> next_int() const {
        std::uint64_t new_seed = (seed * 0x5DEECE66DULL + 0xBULL) & 0xFFFFFFFFFFFFULL;
        int n = static_cast<int>(static_cast<std::uint32_t>(new_seed >> 16));
        return {n, RNG{new_seed}};
    }
};

// Exercise 6.1
std::pair<int, RNG> non_negative_int(RNG rng) {
    auto [i, r] = rng.next_int();
    return {i < 0 ? -(i + 1) : i, r};
}
std::pair<double, RNG> random_double(RNG rng) {
    auto [i, r] = non_negative_int(rng);
    return {i / (static_cast<double>(INT_MAX) + 1), r};
}

// threading state by hand: tedious and easy to get wrong
std::pair<std::tuple<int, double, int>, RNG> int_double_int(RNG rng) {
    auto [i1, r1] = rng.next_int();
    auto [d, r2] = random_double(r1);
    auto [i2, r3] = r2.next_int();
    return {{i1, d, i2}, r3};
}

// ---- Rand<A>: a state action over RNG ------------------------------------------
template <typename A> using Rand = std::function<std::pair<A, RNG>(RNG)>;

const Rand<int> int_ = [](RNG r) { return r.next_int(); };

template <typename A> Rand<A> unit(A a) { return [a](RNG r) { return std::pair{a, r}; }; }

template <typename A, typename F>
auto map(Rand<A> s, F f) -> Rand<std::invoke_result_t<F, A>> {
    return [s, f](RNG rng) {
        auto [a, rng2] = s(rng);
        return std::pair{f(a), rng2};
    };
}

const Rand<int> non_negative_even = map(Rand<int>(non_negative_int), [](int i) { return i - i % 2; });

// Exercise 6.2
template <typename A, typename B, typename F>
auto map2(Rand<A> ra, Rand<B> rb, F f) -> Rand<std::invoke_result_t<F, A, B>> {
    return [ra, rb, f](RNG rng) {
        auto [a, r1] = ra(rng);
        auto [b, r2] = rb(r1);
        return std::pair{f(a, b), r2};
    };
}
template <typename A, typename B> Rand<std::pair<A, B>> both(Rand<A> ra, Rand<B> rb) {
    return map2(ra, rb, [](A a, B b) { return std::pair{a, b}; });
}
template <typename A> Rand<std::vector<A>> sequence(std::vector<Rand<A>> rs) {
    return [rs](RNG rng) {
        std::vector<A> out;
        for (const auto& r : rs) { auto [a, next] = r(rng); out.push_back(a); rng = next; }
        return std::pair{out, rng};
    };
}
Rand<std::vector<int>> ints(int count) { return sequence(std::vector<Rand<int>>(count, int_)); }

// ---- flat_map: the result chooses the next action -----------------------------------
template <typename A, typename F>
auto flat_map(Rand<A> r, F f) -> std::invoke_result_t<F, A> {
    return [r, f](RNG rng) {
        auto [a, rng2] = r(rng);
        return f(a)(rng2);
    };
}

Rand<int> non_negative_less_than(int n) {
    return flat_map(Rand<int>(non_negative_int), [n](int i) -> Rand<int> {
        int mod = i % n;
        if (i + (n - 1) - mod >= 0) return unit(mod);   // no overflow: not in the biased top range
        return non_negative_less_than(n);              // retry with the next state
    });
}

// Exercise 6.3
template <typename A, typename F>
auto map_via_flat_map(Rand<A> r, F f) -> Rand<std::invoke_result_t<F, A>> {
    using B = std::invoke_result_t<F, A>;
    return flat_map(r, [f](A a) { return unit<B>(f(a)); });
}

// ---- State<S, A>: the same thing for any state type ------------------------------
template <typename S, typename A>
class State {
    std::function<std::pair<A, S>(S)> run_;
public:
    using value_type = A;
    explicit State(std::function<std::pair<A, S>(S)> f) : run_(std::move(f)) {}

    std::pair<A, S> run(S s) const { return run_(std::move(s)); }

    static State unit(A a) { return State([a](S s) { return std::pair{a, std::move(s)}; }); }

    template <typename F>      // F: A -> State<S, B>
    auto flat_map(F f) const -> std::invoke_result_t<F, A> {
        auto self = *this;
        return std::invoke_result_t<F, A>([self, f](S s) {
            auto [a, s1] = self.run(std::move(s));
            return f(a).run(std::move(s1));
        });
    }
    template <typename F>      // F: A -> B
    auto map(F f) const -> State<S, std::invoke_result_t<F, A>> {
        using B = std::invoke_result_t<F, A>;
        return flat_map([f](A a) { return State<S, B>::unit(f(a)); });
    }
    template <typename B, typename F>
    auto map2(State<S, B> sb, F f) const -> State<S, std::invoke_result_t<F, A, B>> {
        return flat_map([sb, f](A a) { return sb.map([a, f](B b) { return f(a, b); }); });
    }
};

template <typename S> State<S, S> get() { return State<S, S>([](S s) { return std::pair{s, s}; }); }
template <typename S> State<S, std::monostate> set(S s) {
    return State<S, std::monostate>([s](S) { return std::pair{std::monostate{}, s}; });
}
template <typename S, typename F> State<S, std::monostate> modify(F f) {
    return get<S>().flat_map([f](S s) { return set<S>(f(s)); });
}

// Exercise 6.4: stack-safe traverse (a loop; the mutation is local to one run)
template <typename S, typename A, typename F>
auto traverse(std::vector<A> as, F f)
    -> State<S, std::vector<typename std::invoke_result_t<F, A>::value_type>> {
    using B = typename std::invoke_result_t<F, A>::value_type;
    return State<S, std::vector<B>>([as, f](S s) {
        std::vector<B> out;
        for (const auto& a : as) { auto [b, s2] = f(a).run(std::move(s)); out.push_back(b); s = std::move(s2); }
        return std::pair{out, s};
    });
}

// ---- worked example: a metro turnstile ---------------------------------------------
enum class Input { Token, Push };
struct Gate {
    bool locked; int tokens; int passengers;
    bool operator==(const Gate&) const = default;
};

Gate step(Input i, Gate g) {                 // the rules: a pure function
    if (i == Input::Token && g.locked)  return {false, g.tokens + 1, g.passengers};
    if (i == Input::Push  && !g.locked) return {true, g.tokens, g.passengers + 1};
    return g;                                // anything else: no change
}

State<Gate, std::pair<int, int>> simulate(std::vector<Input> inputs) {
    return traverse<Gate>(inputs, [](Input i) { return modify<Gate>([i](Gate g) { return step(i, g); }); })
        .flat_map([](auto) { return get<Gate>(); })
        .map([](Gate g) { return std::pair{g.tokens, g.passengers}; });
}

int main() {
    RNG rng{42};
    auto [n1, rng2] = rng.next_int();
    auto [n2, rng3] = rng2.next_int();
    assert(n1 == 16159453 && n2 == -1281479697);
    assert(rng.next_int().first == n1);                  // fully reproducible
    (void)rng3;

    for (std::uint64_t s = 0; s < 1000; ++s) {
        assert(non_negative_int(RNG{s}).first >= 0);
        double d = random_double(RNG{s}).first;
        assert(d >= 0.0 && d < 1.0);
        assert(non_negative_even(RNG{s}).first % 2 == 0);
        int k = non_negative_less_than(7)(RNG{s}).first;
        assert(k >= 0 && k < 7);
    }
    auto [three, r] = ints(3)(RNG{1});
    assert(three.size() == 3); (void)r;
    assert(both(int_, unit(5))(RNG{1}).first.second == 5);
    assert(map_via_flat_map(unit(2), [](int x) { return x * 3; })(RNG{1}).first == 6);
    auto [tuple, rr] = int_double_int(RNG{7}); (void)tuple; (void)rr;

    auto result = simulate({Input::Token, Input::Push, Input::Push, Input::Token, Input::Push}).run(Gate{true, 0, 0});
    assert((result.first == std::pair{2, 2}));
    assert((result.second == Gate{true, 2, 2}));

    // long inputs are fine: traverse is a loop
    std::vector<Input> many(200'000, Input::Token);
    assert(simulate(many).run(Gate{true, 0, 0}).first.first == 1);

    std::cout << "ch06 ok\n";
}
