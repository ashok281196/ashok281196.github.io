// Chapter 10 · Monoids
// Build: g++ -std=c++23 -O2 -Wall -pthread ch10.cpp -o ch10 && ./ch10
#include <cassert>
#include <cctype>
#include <concepts>
#include <functional>
#include <future>
#include <iostream>
#include <map>
#include <optional>
#include <ranges>
#include <span>
#include <string>
#include <utility>
#include <variant>
#include <vector>

// ---- a monoid is a type with an associative combine and an identity ---------
template <typename M>
concept Monoid = requires(const typename M::type& a, const typename M::type& b) {
    { M::empty() } -> std::convertible_to<typename M::type>;
    { M::combine(a, b) } -> std::convertible_to<typename M::type>;
};

struct StringConcat {
    using type = std::string;
    static type empty() { return ""; }
    static type combine(const type& a, const type& b) { return a + b; }
};
template <typename T> struct VectorConcat {
    using type = std::vector<T>;
    static type empty() { return {}; }
    static type combine(type a, const type& b) { a.insert(a.end(), b.begin(), b.end()); return a; }
};
// Exercise 10.1
struct IntAddition {
    using type = int;
    static type empty() { return 0; }
    static type combine(int a, int b) { return a + b; }
};
struct IntMultiplication {
    using type = int;
    static type empty() { return 1; }
    static type combine(int a, int b) { return a * b; }
};
struct BoolOr {
    using type = bool;
    static type empty() { return false; }
    static type combine(bool a, bool b) { return a || b; }
};
template <typename T> struct FirstOptional {
    using type = std::optional<T>;
    static type empty() { return std::nullopt; }
    static type combine(const type& a, const type& b) { return a ? a : b; }
};
template <typename T> struct Endo {                       // functions T -> T under composition
    using type = std::function<T(T)>;
    static type empty() { return [](T t) { return t; }; }
    static type combine(type f, type g) { return [f, g](T t) { return g(f(t)); }; }   // f, then g
};
template <Monoid M> struct Dual {                          // the same monoid, arguments swapped
    using type = typename M::type;
    static type empty() { return M::empty(); }
    static type combine(const type& a, const type& b) { return M::combine(b, a); }
};

static_assert(Monoid<IntAddition> && Monoid<StringConcat> && Monoid<Endo<int>>);

// ---- folding with a monoid -----------------------------------------------------
template <Monoid M, std::ranges::input_range R>
typename M::type combine_all(const R& xs) {
    auto acc = M::empty();
    for (const auto& x : xs) acc = M::combine(acc, x);
    return acc;
}

// foldMap: map each element into the monoid, then combine. Works for ANY range:
// in C++, "Foldable" is the input_range concept.
template <Monoid M, std::ranges::input_range R, typename F>
typename M::type fold_map(const R& xs, F f) {
    auto acc = M::empty();
    for (const auto& x : xs) acc = M::combine(acc, f(x));
    return acc;
}

// foldRight via foldMap and the endofunction monoid (a classic puzzle)
template <typename A, typename B, typename F>
B fold_right_via_fold_map(const std::vector<A>& xs, B z, F f) {
    auto g = fold_map<Dual<Endo<B>>>(xs, [f](const A& a) { return std::function<B(B)>([f, a](B b) { return f(a, b); }); });
    return g(z);
}

// ---- associativity buys a balanced (and parallel) fold ------------------------
template <Monoid M, typename A, typename F>
typename M::type fold_map_balanced(std::span<const A> as, F f) {
    if (as.empty()) return M::empty();
    if (as.size() == 1) return f(as[0]);
    auto l = as.first(as.size() / 2), r = as.subspan(as.size() / 2);
    return M::combine(fold_map_balanced<M>(l, f), fold_map_balanced<M>(r, f));
}

template <Monoid M, typename A, typename F>
typename M::type fold_map_par(std::span<const A> as, F f, int depth = 3) {
    if (depth == 0 || as.size() < 2) return fold_map_balanced<M>(as, f);
    auto l = as.first(as.size() / 2), r = as.subspan(as.size() / 2);
    auto left = std::async(std::launch::async, [=] { return fold_map_par<M>(l, f, depth - 1); });
    auto right = fold_map_par<M>(r, f, depth - 1);
    return M::combine(left.get(), right);
}

// ---- word count: designing a summary type with a monoid ------------------------
struct Stub { std::string chars; };                                  // no whitespace seen yet
struct Part { std::string l_stub; int words; std::string r_stub; };   // partial | whole words | partial
using WC = std::variant<Stub, Part>;

template <typename... Fs> struct overloaded : Fs... { using Fs::operator()...; };

struct WCMonoid {
    using type = WC;
    static type empty() { return Stub{""}; }
    static type combine(const WC& a, const WC& b) {
        return std::visit(overloaded{
            [](const Stub& x, const Stub& y) -> WC { return Stub{x.chars + y.chars}; },
            [](const Stub& x, const Part& p) -> WC { return Part{x.chars + p.l_stub, p.words, p.r_stub}; },
            [](const Part& p, const Stub& y) -> WC { return Part{p.l_stub, p.words, p.r_stub + y.chars}; },
            [](const Part& p1, const Part& p2) -> WC {
                int joined = (p1.r_stub + p2.l_stub).empty() ? 0 : 1;   // stubs meeting at the seam form one word
                return Part{p1.l_stub, p1.words + joined + p2.words, p2.r_stub};
            },
        }, a, b);
    }
};

int count_words(const std::string& s) {
    auto wc = [](char c) -> WC {
        if (std::isspace(static_cast<unsigned char>(c))) return Part{"", 0, ""};
        return Stub{std::string(1, c)};
    };
    auto unstub = [](const std::string& x) { return x.empty() ? 0 : 1; };
    WC r = fold_map_par<WCMonoid, char>(std::span<const char>(s.data(), s.size()), wc);
    return std::visit(overloaded{
        [&](const Stub& st) { return unstub(st.chars); },
        [&](const Part& p) { return unstub(p.l_stub) + p.words + unstub(p.r_stub); },
    }, r);
}

// ---- composing monoids -----------------------------------------------------------
template <Monoid MA, Monoid MB> struct ProductMonoid {
    using type = std::pair<typename MA::type, typename MB::type>;
    static type empty() { return {MA::empty(), MB::empty()}; }
    static type combine(const type& x, const type& y) {
        return {MA::combine(x.first, y.first), MB::combine(x.second, y.second)};
    }
};
// Exercise 10.2
template <typename K, Monoid MV> struct MapMerge {
    using type = std::map<K, typename MV::type>;
    static type empty() { return {}; }
    static type combine(type a, const type& b) {
        for (const auto& [k, v] : b) {
            auto it = a.find(k);
            a[k] = MV::combine(it == a.end() ? MV::empty() : it->second, v);
        }
        return a;
    }
};
template <typename A> std::map<A, int> bag(const std::vector<A>& as) {
    return fold_map<MapMerge<A, IntAddition>>(as, [](const A& a) { return std::map<A, int>{{a, 1}}; });
}

int main() {
    std::vector<std::string> words{"Hic", "Est", "Index"};
    assert(combine_all<StringConcat>(words) == "HicEstIndex");
    assert(fold_map<IntAddition>(std::vector<std::string>{"a", "bb", "ccc"}, [](const std::string& s) { return (int)s.size(); }) == 6);
    assert(combine_all<IntMultiplication>(std::vector{1, 2, 3, 4}) == 24);
    assert(combine_all<BoolOr>(std::vector{false, true}) == true);
    assert((*combine_all<FirstOptional<int>>(std::vector<std::optional<int>>{std::nullopt, 2, 3}) == 2));
    assert((*combine_all<Dual<FirstOptional<int>>>(std::vector<std::optional<int>>{1, 2, std::nullopt}) == 2));

    auto pipeline = combine_all<Endo<int>>(std::vector<std::function<int(int)>>{
        [](int x) { return x + 1; }, [](int x) { return x * 10; }});
    assert(pipeline(1) == 20);
    assert(fold_right_via_fold_map(std::vector{1, 2, 3}, std::string{}, [](int a, std::string acc) {
        return std::to_string(a) + acc; }) == "123");

    std::vector<int> big(100000, 1);
    assert((fold_map_balanced<IntAddition, int>(big, [](int x) { return x; }) == 100000));
    assert((fold_map_par<IntAddition, int>(big, [](int x) { return x; }) == 100000));

    assert(count_words("lorem ipsum dolor sit amet, ") == 5);
    assert(count_words("  the quick   brown fox jumps over the lazy dog") == 9);
    assert(count_words("") == 0 && count_words("word") == 1);

    // count and sum in ONE pass with a product monoid
    std::vector<int> data{4, 8, 15, 16, 23, 42};
    auto [count, total] = fold_map<ProductMonoid<IntAddition, IntAddition>>(data, [](int x) { return std::pair{1, x}; });
    assert(count == 6 && total == 108 && double(total) / count == 18.0);

    auto b = bag(std::vector<std::string>{"a", "rose", "is", "a", "rose"});
    assert(b["a"] == 2 && b["rose"] == 2 && b["is"] == 1);

    // floating point addition is not associative
    assert((1e20 + -1e20) + 1.0 == 1.0);
    assert(1e20 + (-1e20 + 1.0) == 0.0);
    std::cout << "ch10 ok\n";
}
