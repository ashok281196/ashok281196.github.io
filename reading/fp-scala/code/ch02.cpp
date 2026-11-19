// Chapter 2 · Functions, Recursion & Types
// Build: g++ -std=c++23 -O2 -Wall ch02.cpp -o ch02 && ./ch02
#include <algorithm>
#include <cassert>
#include <cctype>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <span>
#include <string>
#include <vector>

// ---- loops become recursion ---------------------------------------------
long factorial_loop(int n) {
    long acc = 1;
    for (int i = n; i > 0; --i) acc *= i;
    return acc;
}

// accumulator-passing style: the "loop variables" become parameters
long factorial_go(int i, long acc) {
    if (i <= 0) return acc;
    return factorial_go(i - 1, acc * i);     // tail call: nothing left to do after it
}
long factorial(int n) { return factorial_go(n, 1); }

// not a tail call: must multiply AFTER the recursive call returns
long factorial_naive(int n) { return n <= 0 ? 1 : n * factorial_naive(n - 1); }

// Exercise 2.1
long fib_go(int k, long prev, long cur) {
    return k == 0 ? prev : fib_go(k - 1, cur, prev + cur);
}
long fib(int n) { return fib_go(n, 0, 1); }

// ---- higher-order functions ---------------------------------------------
std::string format_result(const std::string& name, int n, const std::function<long(int)>& f) {
    return "The " + name + " of " + std::to_string(n) + " is " + std::to_string(f(n));
}

// ---- polymorphic functions ----------------------------------------------
int find_first_string(std::span<const std::string> ss, const std::string& key) {
    for (size_t i = 0; i < ss.size(); ++i)
        if (ss[i] == key) return static_cast<int>(i);
    return -1;
}

template <typename A, typename Pred>
    requires std::predicate<Pred, const A&>
int find_first(std::span<const A> as, Pred p) {
    for (size_t i = 0; i < as.size(); ++i)
        if (p(as[i])) return static_cast<int>(i);
    return -1;
}

// ---- following the types ------------------------------------------------
// partial1: (A, (A, B) -> C) -> (B -> C)
template <typename A, typename F>
auto partial1(A a, F f) {
    return [a, f](auto b) { return f(a, b); };
}

// Exercise 2.2: curry: ((A, B) -> C) -> (A -> (B -> C))
template <typename F>
auto curry(F f) {
    return [f](auto a) { return [f, a](auto b) { return f(a, b); }; };
}

// Exercise 2.3: uncurry: (A -> B -> C) -> ((A, B) -> C)
template <typename F>
auto uncurry(F f) {
    return [f](auto a, auto b) { return f(a)(b); };
}

// Exercise 2.4: compose: (B -> C, A -> B) -> (A -> C)
template <typename F, typename G>
auto compose(F f, G g) {
    return [f, g](auto a) { return f(g(a)); };
}

// a tiny pipe operator so pipelines read left to right
template <typename F, typename G>
auto and_then(F f, G g) { return compose(g, f); }

int main() {
    assert(factorial(10) == factorial_loop(10) && factorial(10) == factorial_naive(10));
    assert(fib(0) == 0 && fib(1) == 1 && fib(10) == 55);

    std::cout << format_result("absolute value", -42, [](int x) { return long(std::abs(x)); }) << "\n";
    std::cout << format_result("factorial", 7, factorial) << "\n";

    std::vector<std::string> names{"ada", "bjarne", "grace"};
    assert(find_first_string(names, "bjarne") == 1);
    std::vector<int> xs{7, 9, 13};
    assert(find_first<int>(xs, [](int x) { return x == 9; }) == 1);

    auto add = [](int a, int b) { return a + b; };
    assert(partial1(10, add)(5) == 15);
    assert(curry(add)(2)(3) == 5);
    assert(uncurry(curry(add))(2, 3) == 5);

    auto inc = [](int x) { return x + 1; };
    auto dbl = [](int x) { return x * 2; };
    assert(compose(inc, dbl)(5) == 11);        // inc(dbl(5))
    assert(and_then(inc, dbl)(5) == 12);       // dbl(inc(5))

    auto trim = [](std::string s) {
        auto b = s.find_first_not_of(' '), e = s.find_last_not_of(' ');
        return b == std::string::npos ? std::string{} : s.substr(b, e - b + 1);
    };
    auto lower = [](std::string s) {
        std::ranges::transform(s, s.begin(), [](unsigned char c) { return std::tolower(c); });
        return s;
    };
    auto normalise = and_then(trim, lower);
    assert(normalise("  HeLLo ") == "hello");

    std::cout << "ch02 ok\n";
}
