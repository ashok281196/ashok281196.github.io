// Chapter 0 · Orientation & Setup
// Build: g++ -std=c++23 -O2 -Wall ch00.cpp -o ch00 && ./ch00
#include <cassert>
#include <concepts>
#include <functional>
#include <iostream>
#include <span>
#include <variant>
#include <vector>

template <typename... Fs> struct overloaded : Fs... { using Fs::operator()...; };

struct Circle { double r; };
struct Rect   { double w, h; };
using Shape = std::variant<Circle, Rect>;

double area(const Shape& s) {
    return std::visit(overloaded{
        [](const Circle& c) { return 3.14159 * c.r * c.r; },
        [](const Rect& r)   { return r.w * r.h; },
    }, s);
}

template <typename A, std::invocable<A> F>
auto apply_twice(F f, A a) { return f(f(a)); }

struct Point { int x, y; bool operator==(const Point&) const = default; };

template <typename A, typename Gt>
bool is_sorted(std::span<const A> as, Gt gt) {
    if (as.size() < 2) return true;
    return !gt(as[0], as[1]) && is_sorted(as.subspan(1), gt);
}

int main() {
    auto inc = [](int n) { return n + 1; };
    auto twice = [](auto f, int x) { return f(f(x)); };
    assert(twice(inc, 5) == 7);
    std::function<int(int)> g = inc;
    assert(g(1) == 2 && apply_twice(inc, 1) == 3);

    assert(area(Rect{2, 3}) == 6);
    const Point p{1, 2};
    const Point q{.x = p.x, .y = 5};
    auto [x, y] = q;
    assert(x == 1 && y == 5 && p.y == 2);

    std::vector v{1, 2, 3}, w{1, 3, 2};
    assert(is_sorted<int>(v, std::greater{}) && !is_sorted<int>(w, std::greater{}));
    std::cout << "ch00 ok\n";
}
