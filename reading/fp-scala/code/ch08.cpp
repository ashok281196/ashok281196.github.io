// Chapter 8 · Property-Based Testing
// Build: g++ -std=c++23 -O2 -Wall ch08.cpp -o ch08 && ./ch08
#include <algorithm>
#include <cassert>
#include <chrono>
#include <climits>
#include <cstdint>
#include <functional>
#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <string>
#include <utility>
#include <variant>
#include <vector>

// ---- from Chapter 6: RNG and State ---------------------------------------------
struct RNG {
    std::uint64_t seed;
    std::pair<int, RNG> next_int() const {
        std::uint64_t s = (seed * 0x5DEECE66DULL + 0xBULL) & 0xFFFFFFFFFFFFULL;
        return {static_cast<int>(static_cast<std::uint32_t>(s >> 16)), RNG{s}};
    }
};
std::pair<int, RNG> non_negative_int(RNG rng) {
    auto [i, r] = rng.next_int();
    return {i < 0 ? -(i + 1) : i, r};
}
std::pair<double, RNG> random_double(RNG rng) {
    auto [i, r] = non_negative_int(rng);
    return {i / (static_cast<double>(INT_MAX) + 1), r};
}

// ---- Gen<A>: a generator is a State action over RNG -------------------------------
template <typename A>
class Gen {
    std::function<std::pair<A, RNG>(RNG)> run_;
public:
    using value_type = A;
    explicit Gen(std::function<std::pair<A, RNG>(RNG)> f) : run_(std::move(f)) {}
    std::pair<A, RNG> run(RNG r) const { return run_(r); }

    static Gen unit(A a) { return Gen([a](RNG r) { return std::pair{a, r}; }); }

    template <typename F> auto flat_map(F f) const -> std::invoke_result_t<F, A> {
        auto self = *this;
        return std::invoke_result_t<F, A>([self, f](RNG r) {
            auto [a, r2] = self.run(r);
            return f(a).run(r2);
        });
    }
    template <typename F> auto map(F f) const -> Gen<std::invoke_result_t<F, A>> {
        using B = std::invoke_result_t<F, A>;
        return flat_map([f](A a) { return Gen<B>::unit(f(a)); });
    }
    Gen<std::vector<A>> list_of_n(int n) const {
        auto self = *this;
        return Gen<std::vector<A>>([self, n](RNG r) {
            std::vector<A> out;
            for (int i = 0; i < n; ++i) { auto [a, r2] = self.run(r); out.push_back(a); r = r2; }
            return std::pair{out, r};
        });
    }
};

Gen<int> choose(int start, int stop_exclusive) {
    return Gen<int>(non_negative_int).map([=](int n) { return start + n % (stop_exclusive - start); });
}
Gen<bool> boolean() { return Gen<int>(non_negative_int).map([](int n) { return n % 2 == 0; }); }
Gen<double> double01() { return Gen<double>(random_double); }

template <typename A> Gen<std::vector<A>> list_of_random_length(Gen<A> g, int max_len = 20) {
    return choose(0, max_len + 1).flat_map([g](int n) { return g.list_of_n(n); });
}

// Exercise 8.2
template <typename A> Gen<A> union_(Gen<A> g1, Gen<A> g2) {
    return boolean().flat_map([g1, g2](bool b) { return b ? g1 : g2; });
}
template <typename A> Gen<A> weighted(std::pair<Gen<A>, double> g1, std::pair<Gen<A>, double> g2) {
    double threshold = std::abs(g1.second) / (std::abs(g1.second) + std::abs(g2.second));
    return double01().flat_map([=](double d) { return d < threshold ? g1.first : g2.first; });
}

// ---- properties as values -----------------------------------------------------
struct Passed {};
struct Falsified { std::string failure; int successes; };
using Result = std::variant<Passed, Falsified>;
bool is_falsified(const Result& r) { return std::holds_alternative<Falsified>(r); }

template <typename A> std::string show(const std::optional<A>& o);
template <typename A> std::string show(const std::vector<A>& v);
template <typename A> std::string show(const A& a) { std::ostringstream os; os << a; return os.str(); }
template <typename A> std::string show(const std::optional<A>& o) { return o ? "Some(" + show(*o) + ")" : "None"; }
template <typename A> std::string show(const std::vector<A>& v) {
    std::string s = "[";
    for (size_t i = 0; i < v.size(); ++i) s += (i ? ", " : "") + show(v[i]);
    return s + "]";
}

class Prop {
    std::function<Result(int, RNG)> run_;
public:
    explicit Prop(std::function<Result(int, RNG)> f) : run_(std::move(f)) {}
    Result run(int n, RNG r) const { return run_(n, r); }

    Prop operator&&(const Prop& that) const {
        auto self = *this;
        return Prop([self, that](int n, RNG r) {
            auto res = self.run(n, r);
            return is_falsified(res) ? res : that.run(n, r);
        });
    }
    Result check(int n = 100, RNG r = RNG{static_cast<std::uint64_t>(
                     std::chrono::steady_clock::now().time_since_epoch().count())}) const {
        auto res = run(n, r);
        if (auto* f = std::get_if<Falsified>(&res))
            std::cout << "! Falsified after " << f->successes << " passed tests: " << f->failure << "\n";
        else
            std::cout << "+ OK, passed " << n << " tests.\n";
        return res;
    }
};

template <typename A, typename F>
Prop for_all(Gen<A> gen, F f) {
    return Prop([gen, f](int n, RNG rng) -> Result {
        for (int i = 0; i < n; ++i) {
            auto [a, next] = gen.run(rng);
            rng = next;
            try {
                if (!f(a)) return Falsified{show(a), i};
            } catch (const std::exception& e) {
                return Falsified{show(a) + " threw: " + e.what(), i};
            }
        }
        return Passed{};
    });
}

int my_max(const std::vector<int>& xs) { return *std::max_element(xs.begin(), xs.end()); }
int bad_max(const std::vector<int>&) { return INT_MAX; }

int main() {
    auto small_int = choose(-10, 10);
    auto int_list = list_of_random_length(small_int);

    auto reverse_twice = for_all(int_list, [](std::vector<int> ns) {
        auto r = ns; std::reverse(r.begin(), r.end()); std::reverse(r.begin(), r.end());
        return r == ns;
    });
    auto head_is_last_of_reverse = for_all(int_list, [](std::vector<int> ns) {
        if (ns.empty()) return true;
        auto r = ns; std::reverse(r.begin(), r.end());
        return ns.front() == r.back();
    });
    assert(!is_falsified((reverse_twice && head_is_last_of_reverse).check(100, RNG{1})));

    // Exercise 8.1: two properties pin down max
    auto non_empty = small_int.list_of_n(1).flat_map([=](std::vector<int> first) {
        return list_of_random_length(small_int).map([first](std::vector<int> rest) {
            rest.insert(rest.begin(), first.begin(), first.end()); return rest; });
    });
    auto max_props = [&](auto max_fn) {
        return for_all(non_empty, [max_fn](std::vector<int> ns) {
            int m = max_fn(ns);
            bool ge_all = std::all_of(ns.begin(), ns.end(), [m](int x) { return m >= x; });
            bool is_member = std::find(ns.begin(), ns.end(), m) != ns.end();
            return ge_all && is_member;
        });
    };
    assert(!is_falsified(max_props(my_max).check(200, RNG{2})));
    assert(is_falsified(max_props(bad_max).check(200, RNG{2})));   // caught

    // Exercise 8.3: sorted
    auto sorted_prop = for_all(int_list, [](std::vector<int> ns) {
        auto s = ns; std::sort(s.begin(), s.end());
        bool ordered = std::is_sorted(s.begin(), s.end());
        std::map<int, int> c1, c2;
        for (int x : ns) ++c1[x];
        for (int x : s) ++c2[x];
        return ordered && c1 == c2;
    });
    assert(!is_falsified(sorted_prop.check(200, RNG{3})));

    // a law from Chapter 4: transform with identity changes nothing
    auto opt_gen = union_(choose(0, 100).map([](int x) { return std::optional<int>(x); }),
                          Gen<std::optional<int>>::unit(std::nullopt));
    auto map_identity = for_all(opt_gen, [](std::optional<int> o) {
        return o.transform([](int x) { return x; }) == o;
    });
    assert(!is_falsified(map_identity.check(100, RNG{4})));

    // a deliberately false property, to see a counterexample
    auto wrong = for_all(int_list, [](std::vector<int> ns) { return ns.size() < 15; });
    assert(is_falsified(wrong.check(100, RNG{5})));

    auto w = weighted(std::pair{Gen<int>::unit(1), 0.9}, std::pair{Gen<int>::unit(2), 0.1});
    int ones = 0; RNG r{6};
    for (int i = 0; i < 1000; ++i) { auto [v, n] = w.run(r); ones += v == 1; r = n; }
    assert(ones > 800);
    std::cout << "ch08 ok\n";
}
