// Chapter 12 · Applicative & Traversable
// Build: g++ -std=c++23 -O2 -Wall ch12.cpp -o ch12 && ./ch12
#include <cassert>
#include <functional>
#include <iostream>
#include <optional>
#include <string>
#include <utility>
#include <variant>
#include <vector>

// ---- tags for type constructors (as in Chapter 11) ------------------------------
struct OptionalK { template <typename A> using F = std::optional<A>; };

template <typename E, typename A> struct Valid { A value; };
template <typename E> struct Invalid { std::vector<E> errors; };
template <typename E, typename A>
struct Validated {
    using value_type = A;
    std::variant<Valid<E, A>, Invalid<E>> v;
    bool ok() const { return v.index() == 0; }
    const A& value() const { return std::get<0>(v).value; }
    const std::vector<E>& errors() const { return std::get<1>(v).errors; }
};
template <typename E> struct ValidatedK { template <typename A> using F = Validated<E, A>; };

template <typename S, typename A> struct State {
    using value_type = A;
    std::function<std::pair<A, S>(S)> run;
};
template <typename S> struct StateK { template <typename A> using F = State<S, A>; };

// ---- Applicative: unit + map2 (no flat_map!) ---------------------------------------
template <typename K> struct Applicative;

template <> struct Applicative<OptionalK> {
    template <typename A> static std::optional<A> unit(A a) { return a; }
    template <typename A, typename B, typename Fn>
    static auto map2(const std::optional<A>& a, const std::optional<B>& b, Fn f)
        -> std::optional<std::invoke_result_t<Fn, const A&, const B&>> {
        if (a && b) return f(*a, *b);
        return std::nullopt;
    }
};

// Validated: like expected, but map2 KEEPS BOTH error lists
template <typename E> struct Applicative<ValidatedK<E>> {
    template <typename A> static Validated<E, A> unit(A a) { return {Valid<E, A>{a}}; }
    template <typename A, typename B, typename Fn>
    static auto map2(const Validated<E, A>& a, const Validated<E, B>& b, Fn f) {
        using C = std::invoke_result_t<Fn, const A&, const B&>;
        if (a.ok() && b.ok()) return Validated<E, C>{Valid<E, C>{f(a.value(), b.value())}};
        std::vector<E> errs;
        if (!a.ok()) errs.insert(errs.end(), a.errors().begin(), a.errors().end());
        if (!b.ok()) errs.insert(errs.end(), b.errors().begin(), b.errors().end());
        return Validated<E, C>{Invalid<E>{errs}};
    }
};

template <typename S> struct Applicative<StateK<S>> {    // every monad is an applicative
    template <typename A> static State<S, A> unit(A a) { return {[a](S s) { return std::pair{a, s}; }}; }
    template <typename A, typename B, typename Fn>
    static auto map2(const State<S, A>& sa, const State<S, B>& sb, Fn f) {
        using C = std::invoke_result_t<Fn, const A&, const B&>;
        return State<S, C>{[sa, sb, f](S s) {
            auto [a, s1] = sa.run(s);
            auto [b, s2] = sb.run(s1);
            return std::pair{f(a, b), s2};
        }};
    }
};

// derived from unit + map2
template <typename K, typename FA, typename Fn>
auto map(const FA& fa, Fn f) {
    using A = typename FA::value_type;
    return Applicative<K>::map2(fa, Applicative<K>::unit(0), [f](const A& a, int) { return f(a); });
}

// ---- traverse over a vector, generic over ANY applicative ----------------------------
template <typename K, typename A, typename Fn>
auto traverse(const std::vector<A>& as, Fn f) {
    using B = typename std::invoke_result_t<Fn, const A&>::value_type;
    auto acc = Applicative<K>::unit(std::vector<B>{});
    for (const auto& a : as)
        acc = Applicative<K>::map2(acc, f(a), [](std::vector<B> v, const B& b) { v.push_back(b); return v; });
    return acc;
}

// ---- validation that reports every error ----------------------------------------------
using V = ValidatedK<std::string>;
template <typename A> Validated<std::string, A> valid(A a) { return {Valid<std::string, A>{a}}; }
template <typename A> Validated<std::string, A> invalid(std::string e) { return {Invalid<std::string>{{e}}}; }

Validated<std::string, std::string> valid_name(const std::string& n) {
    return n.empty() ? invalid<std::string>("name is empty") : valid(n);
}
Validated<std::string, int> valid_age(int a) {
    return (a < 0 || a > 150) ? invalid<int>("age " + std::to_string(a) + " out of range") : valid(a);
}
Validated<std::string, std::string> valid_email(const std::string& e) {
    return e.find('@') == std::string::npos ? invalid<std::string>("bad email '" + e + "'") : valid(e);
}

struct User { std::string name; int age; std::string email; };

Validated<std::string, User> valid_user(const std::string& n, int a, const std::string& e) {
    using AP = Applicative<V>;
    auto name_age = AP::map2(valid_name(n), valid_age(a), [](std::string n, int a) { return std::pair{n, a}; });
    return AP::map2(name_age, valid_email(e), [](std::pair<std::string, int> na, std::string e) {
        return User{na.first, na.second, e}; });
}

// ---- applicatives compose -------------------------------------------------------------
template <typename K1, typename K2> struct ComposeK {
    template <typename A> using F = typename K1::template F<typename K2::template F<A>>;
};
template <typename K1, typename K2> struct Applicative<ComposeK<K1, K2>> {
    template <typename A> static auto unit(A a) { return Applicative<K1>::unit(Applicative<K2>::unit(a)); }
    template <typename FGA, typename FGB, typename Fn>
    static auto map2(const FGA& fga, const FGB& fgb, Fn f) {
        using GA = typename FGA::value_type;
        using GB = typename FGB::value_type;
        return Applicative<K1>::map2(fga, fgb, [f](const GA& ga, const GB& gb) {
            return Applicative<K2>::map2(ga, gb, f);
        });
    }
};

// ---- Traverse for other structures: optional and a rose tree --------------------------
template <typename K, typename A, typename Fn>
auto traverse_opt(const std::optional<A>& oa, Fn f) {
    using B = typename std::invoke_result_t<Fn, const A&>::value_type;
    if (!oa) return Applicative<K>::unit(std::optional<B>{});
    return map<K>(f(*oa), [](const B& b) { return std::optional<B>(b); });
}

template <typename A> struct Tree { A head; std::vector<Tree> children; };

template <typename K, typename A, typename Fn,
          typename B = typename std::invoke_result_t<Fn, const A&>::value_type>
auto traverse_tree(const Tree<A>& t, Fn f) -> typename K::template F<Tree<B>> {   // recursive: spell out the type
    auto kids = traverse<K>(t.children, [f](const Tree<A>& c) -> typename K::template F<Tree<B>> {
        return traverse_tree<K>(c, f); });
    return Applicative<K>::map2(f(t.head), kids, [](const B& b, std::vector<Tree<B>> cs) { return Tree<B>{b, cs}; });
}

// ---- zip_with_index for any traversable, via the State applicative ---------------------
template <typename A> auto label = [](const A& a) {
    return State<int, std::pair<A, int>>{[a](int i) { return std::pair{std::pair{a, i}, i + 1}; }};
};

int main() {
    // traverse with optional: one failure fails all
    auto to_int = [](const std::string& s) -> std::optional<int> {
        if (s.empty() || s.find_first_not_of("0123456789") != std::string::npos) return std::nullopt;
        return std::stoi(s);
    };
    assert((*traverse<OptionalK>(std::vector<std::string>{"1", "2"}, to_int) == std::vector{1, 2}));
    assert(!traverse<OptionalK>(std::vector<std::string>{"1", "x"}, to_int));

    // validation collects all errors
    auto u = valid_user("", -5, "nope");
    assert(!u.ok() && u.errors().size() == 3);
    for (auto& e : u.errors()) std::cout << "  - " << e << "\n";
    assert(valid_user("Ashok", 29, "a@b.c").ok());

    // traverse with Validated: check every item, report every failure
    auto checked = traverse<V>(std::vector{10, -1, 200}, valid_age);
    assert(!checked.ok() && checked.errors().size() == 2);

    // composed applicative: optional<Validated<...>>
    using OV = ComposeK<OptionalK, V>;
    auto both = Applicative<OV>::map2(std::optional{valid(2)}, std::optional{valid(3)}, std::plus{});
    assert(both && both->ok() && both->value() == 5);

    // traverse other structures
    auto half = [](int x) -> std::optional<int> { if (x % 2) return std::nullopt; return x / 2; };
    assert((*traverse_opt<OptionalK>(std::optional{4}, half) == std::optional{2}));
    assert((traverse_opt<OptionalK>(std::optional<int>{}, half)->has_value() == false));
    Tree<int> t{2, {{4, {}}, {6, {{8, {}}}}}};
    auto th = traverse_tree<OptionalK>(t, half);
    assert(th && th->head == 1 && th->children[1].children[0].head == 4);
    t.children[0].head = 5;
    assert(!traverse_tree<OptionalK>(t, half));

    // zip_with_index on a vector and on a tree, the same function
    auto [indexed, next] = traverse<StateK<int>>(std::vector<std::string>{"a", "b", "c"}, label<std::string>).run(0);
    assert(indexed[2].second == 2 && next == 3);
    Tree<char> ct{'r', {{'x', {}}, {'y', {{'z', {}}}}}};
    auto [itree, n] = traverse_tree<StateK<int>>(ct, label<char>).run(0);
    assert(itree.head.second == 0 && itree.children[1].children[0].head.second == 3 && n == 4);

    std::cout << "ch12 ok\n";
}
