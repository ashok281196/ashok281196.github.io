// Chapter 3 · Functional Data Structures
// Build: g++ -std=c++23 -O2 -Wall ch03.cpp -o ch03 && ./ch03
#include <cassert>
#include <initializer_list>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <variant>
#include <vector>

// ======================================================================
// A persistent singly linked list. Nodes are never modified after
// construction, so sharing them between lists is always safe.
// ======================================================================
template <typename T>
class List {
    struct Node {
        T head;
        std::shared_ptr<Node> tail;   // never mutated after construction (except by ~List)
    };
    std::shared_ptr<Node> node_;
    explicit List(std::shared_ptr<Node> n) : node_(std::move(n)) {}

public:
    List() = default;                                       // Nil
    List(std::initializer_list<T> xs) {                     // List<int>{1, 2, 3}
        std::vector<T> v(xs);
        for (auto it = v.rbegin(); it != v.rend(); ++it) *this = cons(*it, *this);
    }
    static List cons(T h, List t) {                         // Cons(h, t): O(1), shares t
        return List(std::make_shared<Node>(Node{std::move(h), std::move(t.node_)}));
    }

    bool empty() const { return !node_; }
    const T& head() const { return node_->head; }
    List tail() const { return List(node_->tail); }

    // Long chains would otherwise be destroyed recursively (one stack frame per node).
    // Unlink iteratively while we are the only owner.
    ~List() {
        auto n = std::move(node_);
        while (n && n.use_count() == 1) n = std::move(n->tail);
    }
    List(const List&) = default;
    List(List&&) noexcept = default;
    List& operator=(const List&) = default;
    List& operator=(List&&) noexcept = default;

    bool shares_tail_with(const List& other) const { return node_ && node_->tail == other.node_; }
};

template <typename T> List<T> cons(T h, List<T> t) { return List<T>::cons(std::move(h), std::move(t)); }

// ---- functions follow the shape of the data ----------------------------
int sum(const List<int>& xs) { return xs.empty() ? 0 : xs.head() + sum(xs.tail()); }

double product(const List<double>& xs) {
    if (xs.empty()) return 1.0;
    if (xs.head() == 0.0) return 0.0;
    return xs.head() * product(xs.tail());
}

// Exercise 3.1
template <typename T> List<T> tail(const List<T>& xs) {
    if (xs.empty()) throw std::logic_error("tail of empty list");
    return xs.tail();
}
template <typename T> List<T> set_head(const List<T>& xs, T h) {
    if (xs.empty()) throw std::logic_error("set_head on empty list");
    return cons(std::move(h), xs.tail());
}

// Exercise 3.2
template <typename T> List<T> drop(List<T> xs, int n) {
    while (n-- > 0 && !xs.empty()) xs = xs.tail();
    return xs;
}
template <typename T, typename P> List<T> drop_while(List<T> xs, P p) {
    while (!xs.empty() && p(xs.head())) xs = xs.tail();
    return xs;
}

// append copies the first list and shares the second
template <typename T> List<T> append(const List<T>& a, const List<T>& b) {
    return a.empty() ? b : cons(a.head(), append(a.tail(), b));
}

// init has to copy everything
template <typename T> List<T> init(const List<T>& xs) {
    if (xs.empty()) throw std::logic_error("init of empty list");
    if (xs.tail().empty()) return {};
    return cons(xs.head(), init(xs.tail()));
}

// ---- folds -------------------------------------------------------------
// fold_right replaces cons with f and nil with acc. Recursive: not stack-safe.
template <typename T, typename B, typename F>
B fold_right(const List<T>& xs, B acc, F f) {
    return xs.empty() ? acc : f(xs.head(), fold_right(xs.tail(), std::move(acc), f));
}

// fold_left is a loop
template <typename T, typename B, typename F>
B fold_left(List<T> xs, B acc, F f) {
    while (!xs.empty()) { acc = f(std::move(acc), xs.head()); xs = xs.tail(); }
    return acc;
}

// Exercise 3.3
template <typename T> int length(const List<T>& xs) {
    return fold_left(xs, 0, [](int n, const T&) { return n + 1; });
}
template <typename T> List<T> reverse(const List<T>& xs) {
    return fold_left(xs, List<T>{}, [](List<T> acc, const T& a) { return cons(a, std::move(acc)); });
}

// Exercise 3.4
template <typename T, typename B, typename F>
B fold_right_safe(const List<T>& xs, B acc, F f) {
    return fold_left(reverse(xs), std::move(acc), [&f](B b, const T& a) { return f(a, std::move(b)); });
}

// ---- map, filter, flat_map ----------------------------------------------
template <typename T, typename F>
auto map(const List<T>& xs, F f) {
    using U = std::invoke_result_t<F, const T&>;
    return fold_right_safe(xs, List<U>{}, [&f](const T& a, List<U> acc) { return cons(f(a), std::move(acc)); });
}

template <typename T, typename P>
List<T> filter(const List<T>& xs, P p) {
    return fold_right_safe(xs, List<T>{}, [&p](const T& a, List<T> acc) {
        return p(a) ? cons(a, std::move(acc)) : acc;
    });
}

template <typename T>
List<T> concat(const List<List<T>>& ls) {
    return fold_right_safe(ls, List<T>{}, [](const List<T>& l, List<T> acc) { return append(l, acc); });
}

template <typename T, typename F>
auto flat_map(const List<T>& xs, F f) { return concat(map(xs, f)); }

// Exercise 3.5
template <typename T, typename P>
List<T> filter_via_flat_map(const List<T>& xs, P p) {
    return flat_map(xs, [&p](const T& a) { return p(a) ? List<T>{a} : List<T>{}; });
}

// Exercise 3.6
template <typename A, typename B, typename F>
auto zip_with(const List<A>& as, const List<B>& bs, F f) {
    using C = std::invoke_result_t<F, const A&, const B&>;
    if (as.empty() || bs.empty()) return List<C>{};
    return cons(f(as.head(), bs.head()), zip_with(as.tail(), bs.tail(), f));
}

template <typename T> std::vector<T> to_vector(List<T> xs) {
    std::vector<T> v;
    for (; !xs.empty(); xs = xs.tail()) v.push_back(xs.head());
    return v;
}

// ======================================================================
// Trees: a sum type with std::variant
// ======================================================================
template <typename... Fs> struct overloaded : Fs... { using Fs::operator()...; };

template <typename T>
struct Tree {
    struct Leaf { T value; };
    struct Branch { std::shared_ptr<const Tree> left, right; };
    std::variant<Leaf, Branch> v;
};

template <typename T> Tree<T> leaf(T a) { return {typename Tree<T>::Leaf{std::move(a)}}; }
template <typename T> Tree<T> branch(Tree<T> l, Tree<T> r) {
    return {typename Tree<T>::Branch{std::make_shared<const Tree<T>>(std::move(l)),
                                     std::make_shared<const Tree<T>>(std::move(r))}};
}

template <typename T> int size(const Tree<T>& t) {
    return std::visit(overloaded{
        [](const typename Tree<T>::Leaf&) { return 1; },
        [](const typename Tree<T>::Branch& b) { return 1 + size(*b.left) + size(*b.right); },
    }, t.v);
}

template <typename T> int depth(const Tree<T>& t) {
    return std::visit(overloaded{
        [](const typename Tree<T>::Leaf&) { return 0; },
        [](const typename Tree<T>::Branch& b) { return 1 + std::max(depth(*b.left), depth(*b.right)); },
    }, t.v);
}

// Exercise 3.7: fold replaces Leaf with f and Branch with g
template <typename T, typename F, typename G>
auto fold(const Tree<T>& t, F f, G g) -> std::invoke_result_t<F, const T&> {
    return std::visit(overloaded{
        [&](const typename Tree<T>::Leaf& l) { return f(l.value); },
        [&](const typename Tree<T>::Branch& b) { return g(fold(*b.left, f, g), fold(*b.right, f, g)); },
    }, t.v);
}

template <typename T> int size_via_fold(const Tree<T>& t) {
    return fold(t, [](const T&) { return 1; }, [](int l, int r) { return 1 + l + r; });
}
template <typename T> int depth_via_fold(const Tree<T>& t) {
    return fold(t, [](const T&) { return 0; }, [](int l, int r) { return 1 + std::max(l, r); });
}
template <typename T, typename F> auto map_tree(const Tree<T>& t, F f) {
    using U = std::invoke_result_t<F, const T&>;
    return fold(t, [&](const T& a) { return leaf<U>(f(a)); },
                   [](Tree<U> l, Tree<U> r) { return branch(std::move(l), std::move(r)); });
}

int main() {
    List<int> xs{1, 2, 3};
    assert(sum(xs) == 6 && product(List<double>{1.5, 2.0}) == 3.0);

    auto ys = cons(0, xs);
    assert(ys.shares_tail_with(xs));                     // structural sharing
    assert(to_vector(set_head(xs, 9)) == (std::vector{9, 2, 3}));
    assert(to_vector(drop(xs, 2)) == std::vector{3});
    assert(to_vector(drop_while(xs, [](int x) { return x < 3; })) == std::vector{3});
    assert(to_vector(append(xs, List<int>{4})) == (std::vector{1, 2, 3, 4}));
    assert(to_vector(init(xs)) == (std::vector{1, 2}));

    assert(fold_right(xs, 0, [](int a, int b) { return a + b; }) == 6);
    assert(length(xs) == 3 && to_vector(reverse(xs)) == (std::vector{3, 2, 1}));
    assert(to_vector(map(xs, [](int x) { return x * 10; })) == (std::vector{10, 20, 30}));
    assert(to_vector(filter(xs, [](int x) { return x % 2 == 1; })) == (std::vector{1, 3}));
    assert(to_vector(flat_map(xs, [](int x) { return List<int>{x, x}; })) == (std::vector{1, 1, 2, 2, 3, 3}));
    assert(to_vector(filter_via_flat_map(xs, [](int x) { return x > 1; })) == (std::vector{2, 3}));
    assert(to_vector(zip_with(xs, List<int>{10, 20}, [](int a, int b) { return a + b; })) == (std::vector{11, 22}));

    // a million elements: fold_left and the destructor are both stack-safe
    List<int> big;
    for (int i = 0; i < 1'000'000; ++i) big = cons(1, std::move(big));
    assert(fold_left(big, 0L, [](long acc, int x) { return acc + x; }) == 1'000'000);
    assert(fold_right_safe(big, 0L, [](int x, long acc) { return acc + x; }) == 1'000'000);

    auto t = branch(branch(leaf(1), leaf(2)), leaf(3));
    assert(size(t) == 5 && depth(t) == 2);
    assert(size_via_fold(t) == 5 && depth_via_fold(t) == 2);
    auto t2 = map_tree(t, [](int x) { return std::to_string(x); });
    assert(size(t2) == 5);

    std::cout << "ch03 ok\n";
}
