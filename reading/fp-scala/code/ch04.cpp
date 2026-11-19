// Chapter 4 · Errors as Values
// Build: g++ -std=c++23 -O2 -Wall ch04.cpp -o ch04 && ./ch04
#include <cassert>
#include <charconv>
#include <cmath>
#include <expected>
#include <functional>
#include <iostream>
#include <map>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

// ---- exceptions break referential transparency -------------------------
int failing_fn() {
    int y = [] () -> int { throw std::runtime_error("fail!"); }();   // throws here
    try { return 42 + 5 + y; } catch (...) { return 43; }
}
int failing_fn2() {
    try { return 42 + 5 + [] () -> int { throw std::runtime_error("fail!"); }(); }
    catch (...) { return 43; }                                         // same expression, now caught
}

// ---- our own map / flat_map on std::optional, to see how they work ------
template <typename A, typename F>
auto opt_map(const std::optional<A>& oa, F f) -> std::optional<std::invoke_result_t<F, const A&>> {
    if (!oa) return std::nullopt;
    return f(*oa);
}
template <typename A, typename F>
auto opt_flat_map(const std::optional<A>& oa, F f) -> std::invoke_result_t<F, const A&> {
    if (!oa) return std::nullopt;
    return f(*oa);
}

std::optional<double> mean(const std::vector<double>& xs) {
    if (xs.empty()) return std::nullopt;
    double s = 0; for (double x : xs) s += x;
    return s / xs.size();
}

// Exercise 4.1
std::optional<double> variance(const std::vector<double>& xs) {
    return mean(xs).and_then([&](double m) {
        std::vector<double> sq;
        for (double x : xs) sq.push_back(std::pow(x - m, 2));
        return mean(sq);
    });
}

// ---- pipelines with C++23 monadic operations ----------------------------
struct Employee { std::string name; std::string dept; std::optional<std::string> manager; };
std::map<std::string, Employee> db{
    {"Joe", {"Joe", "Robotics", "Asha"}},
    {"Ann", {"Ann", "Perception", std::nullopt}},
};
std::optional<Employee> lookup_by_name(const std::string& n) {
    auto it = db.find(n);
    if (it == db.end()) return std::nullopt;
    return it->second;
}
std::string manager_of(const std::string& name) {
    return lookup_by_name(name)
        .and_then([](const Employee& e) { return e.manager; })
        .transform([](std::string m) { for (auto& c : m) c = std::toupper(c); return m; })
        .value_or("(no manager)");
}

// ---- lifting -------------------------------------------------------------
template <typename F>
auto lift(F f) {
    return [f]<typename A>(const std::optional<A>& oa) { return oa.transform(f); };
}

std::optional<int> to_int(const std::string& s) {   // convert at the boundary, no exceptions
    int v{};
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{} || p != s.data() + s.size()) return std::nullopt;
    return v;
}

double insurance_rate(int age, int tickets) { return 100.0 + age * 0.5 + tickets * 20.0; }

// Exercise 4.2
template <typename A, typename B, typename F>
auto map2(const std::optional<A>& a, const std::optional<B>& b, F f)
    -> std::optional<std::invoke_result_t<F, const A&, const B&>> {
    return a.and_then([&](const A& aa) { return b.transform([&](const B& bb) { return f(aa, bb); }); });
}

std::optional<double> parse_insurance_rate_quote(const std::string& age, const std::string& tickets) {
    return map2(to_int(age), to_int(tickets), insurance_rate);
}

// ---- sequence and traverse ----------------------------------------------
template <typename A, typename F>
auto traverse(const std::vector<A>& as, F f)
    -> std::optional<std::vector<typename std::invoke_result_t<F, const A&>::value_type>> {
    using B = typename std::invoke_result_t<F, const A&>::value_type;
    std::vector<B> out;
    out.reserve(as.size());
    for (const auto& a : as) {
        auto ob = f(a);
        if (!ob) return std::nullopt;      // one failure fails the whole thing
        out.push_back(std::move(*ob));
    }
    return out;
}
template <typename A>
std::optional<std::vector<A>> sequence(const std::vector<std::optional<A>>& as) {
    return traverse(as, [](const std::optional<A>& o) { return o; });
}

// ---- std::expected: failure with a reason -------------------------------
std::expected<int, std::string> safe_div(int x, int y) {
    if (y == 0) return std::unexpected("division by zero");
    return x / y;
}

struct Person { std::string name; int age; };
std::expected<std::string, std::string> mk_name(const std::string& n) {
    if (n.empty()) return std::unexpected("name is empty");
    return n;
}
std::expected<int, std::string> mk_age(int a) {
    if (a < 0) return std::unexpected("age is out of range");
    return a;
}
std::expected<Person, std::string> mk_person(const std::string& n, int a) {
    return mk_name(n).and_then([&](std::string name) {
        return mk_age(a).transform([&](int age) { return Person{name, age}; });
    });
}

// Exercise 4.4
template <typename F>
auto catch_non_fatal(F f) -> std::expected<std::invoke_result_t<F>, std::string> {
    try { return f(); }
    catch (const std::exception& e) { return std::unexpected(std::string(e.what())); }
}

int main() {
    try { failing_fn(); assert(false); } catch (const std::runtime_error&) {}
    assert(failing_fn2() == 43);

    assert(*opt_map(std::optional{2}, [](int x) { return x * 10; }) == 20);
    assert(!opt_flat_map(std::optional{2}, [](int) { return std::optional<int>{}; }));
    assert(!mean({}) && *mean({1, 2, 3}) == 2);
    assert(std::abs(*variance({1, 2, 3, 4}) - 1.25) < 1e-9);

    assert(manager_of("Joe") == "ASHA");
    assert(manager_of("Ann") == "(no manager)");
    assert(manager_of("Zed") == "(no manager)");

    auto abs_o = lift([](double d) { return std::fabs(d); });
    assert(*abs_o(std::optional{-2.5}) == 2.5);

    assert(parse_insurance_rate_quote("30", "2").has_value());
    assert(!parse_insurance_rate_quote("thirty", "2").has_value());

    std::vector<std::string> good{"1", "2", "3"}, bad{"1", "x", "3"};
    assert((*traverse(good, to_int) == std::vector{1, 2, 3}));
    assert(!traverse(bad, to_int));
    assert(sequence(std::vector<std::optional<int>>{1, 2}).has_value());

    assert(*safe_div(6, 3) == 2 && safe_div(1, 0).error() == "division by zero");
    assert(mk_person("Ashok", 29)->age == 29);
    assert(mk_person("", -1).error() == "name is empty");   // only the FIRST error

    auto r = catch_non_fatal([] { return std::stoi("nope"); });
    assert(!r.has_value());
    std::cout << "ch04 ok\n";
}
