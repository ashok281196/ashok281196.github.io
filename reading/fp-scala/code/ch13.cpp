// Chapter 13 · Effects, IO & Local Mutation
// Build: g++ -std=c++23 -O2 -Wall ch13.cpp -o ch13 && ./ch13
#include <algorithm>
#include <any>
#include <cassert>
#include <functional>
#include <iomanip>
#include <iostream>
#include <memory>
#include <optional>
#include <sstream>
#include <string>
#include <type_traits>
#include <utility>
#include <variant>
#include <vector>

// ---- 13.1 functional core, imperative shell ---------------------------------------
struct Player { std::string name; int score; };

std::optional<Player> winner(const Player& p1, const Player& p2) {     // pure
    if (p1.score > p2.score) return p1;
    if (p2.score > p1.score) return p2;
    return std::nullopt;
}
std::string winner_msg(const std::optional<Player>& p) {               // pure
    return p ? p->name + " wins" : "It's a draw";
}
void contest(const Player& p1, const Player& p2) {                     // impure, but tiny
    std::cout << winner_msg(winner(p1, p2)) << "\n";
}

// ---- 13.2 a simple IO type: a program as a value --------------------------------------
std::istream* input = &std::cin;       // swapped for a string stream in main() so the demo is self-contained
std::ostream* output = &std::cout;

namespace simple {
template <typename A>
class IO {
    std::function<A()> thunk_;
public:
    using value_type = A;
    explicit IO(std::function<A()> f) : thunk_(std::move(f)) {}
    A unsafe_run() const { return thunk_(); }          // the ONLY place effects happen

    template <typename F> auto map(F f) const -> IO<std::invoke_result_t<F, A>> {
        auto self = *this;
        return IO<std::invoke_result_t<F, A>>([self, f] { return f(self.unsafe_run()); });
    }
    template <typename F> auto flat_map(F f) const -> std::invoke_result_t<F, A> {
        auto self = *this;
        return std::invoke_result_t<F, A>([self, f] { return f(self.unsafe_run()).unsafe_run(); });
    }
};
IO<std::monostate> print_line(std::string msg) {
    return IO<std::monostate>([msg] { *output << msg << "\n"; return std::monostate{}; });
}
IO<std::string> read_line() {
    return IO<std::string>([] { std::string s; std::getline(*input, s); return s; });
}
double f_to_c(double f) { return (f - 32) * 5.0 / 9.0; }

IO<std::monostate> converter() {
    return print_line("Enter a temperature in degrees Fahrenheit:")
        .flat_map([](auto) { return read_line(); })
        .map([](std::string s) { return std::stod(s); })
        .flat_map([](double d) {
            std::ostringstream os; os << std::fixed << std::setprecision(1) << f_to_c(d) << " C";
            return print_line(os.str());
        });
}

// count_down(n): n nested flat_maps. Each unsafe_run calls the next: stack depth grows with n.
IO<int> count_down(int n) {
    if (n == 0) return IO<int>([] { return 0; });
    return IO<int>([] { return 1; }).flat_map([n](int) { return count_down(n - 1); });
}
}  // namespace simple

// ---- 13.3 a trampolined IO: a run loop with an explicit continuation stack ------------
namespace tramp {
struct Node;
using NodePtr = std::shared_ptr<const Node>;
struct Pure  { std::any value; };                                   // done: here's the value
struct Delay { std::function<std::any()> thunk; };                  // perform this effect
struct Bind  { NodePtr sub; std::function<NodePtr(std::any)> k; };  // run sub, then continue with k
struct Node  {
    std::variant<Pure, Delay, Bind> v;
    ~Node();   // a million-deep chain of Binds must not be destroyed recursively
};
Node::~Node() {
    std::vector<NodePtr> pending;
    if (auto* b = std::get_if<Bind>(&v)) pending.push_back(std::move(b->sub));
    while (!pending.empty()) {
        NodePtr n = std::move(pending.back());
        pending.pop_back();
        if (n.use_count() == 1)                       // we are the last owner: unlink its child first
            if (auto* b = std::get_if<Bind>(&const_cast<Node*>(n.get())->v))
                pending.push_back(std::move(b->sub));
    }                                                 // n is destroyed here with no child attached
}

std::any run_loop(NodePtr io) {
    std::vector<std::function<NodePtr(std::any)>> stack;   // continuations live on the heap, not the call stack
    for (;;) {
        if (auto* b = std::get_if<Bind>(&io->v)) {          // push the continuation, descend into sub
            stack.push_back(b->k);
            io = b->sub;
            continue;
        }
        std::any value = std::holds_alternative<Pure>(io->v) ? std::get<Pure>(io->v).value
                                                              : std::get<Delay>(io->v).thunk();
        if (stack.empty()) return value;
        auto k = std::move(stack.back());
        stack.pop_back();
        io = k(std::move(value));                           // bounce: back to the top of the loop
    }
}

template <typename A>
class IO {
public:
    NodePtr node;
    using value_type = A;
    static IO pure(A a) { return {std::make_shared<const Node>(Node{Pure{std::move(a)}})}; }
    static IO delay(std::function<A()> f) {
        return {std::make_shared<const Node>(Node{Delay{[f] { return std::any(f()); }}})};
    }
    template <typename F> auto flat_map(F f) const -> std::invoke_result_t<F, A> {
        using IOB = std::invoke_result_t<F, A>;
        return IOB{std::make_shared<const Node>(Node{Bind{node, [f](std::any a) {
            return f(std::any_cast<A>(std::move(a))).node; }}})};
    }
    template <typename F> auto map(F f) const -> IO<std::invoke_result_t<F, A>> {
        using B = std::invoke_result_t<F, A>;
        return flat_map([f](A a) { return IO<B>::pure(f(std::move(a))); });
    }
    A unsafe_run() const { return std::any_cast<A>(run_loop(node)); }
};

IO<int> count_down(int n) {
    if (n == 0) return IO<int>::pure(0);
    return IO<int>::delay([] { return 1; }).flat_map([n](int) { return count_down(n - 1); });
}
// left-nested: ((((x >>= f) >>= f) >>= f) ...) a million deep, also fine
IO<long> left_nested(int n) {
    IO<long> io = IO<long>::pure(0);
    for (int i = 0; i < n; ++i) io = io.flat_map([](long x) { return IO<long>::pure(x + 1); });
    return io;
}
// a loop that runs until a condition: "forever", stopped by the effect itself
IO<int> repeat_until(std::function<int()> step, int target) {
    return IO<int>::delay(step).flat_map([step, target](int v) {
        return v >= target ? IO<int>::pure(v) : repeat_until(step, target);
    });
}
}  // namespace tramp

// ---- 13.5 local mutation that cannot escape ------------------------------------------------
// STRef<S, T> is tagged with the scope's type S, and only a scope can create one.
template <typename S> class STScope;
template <typename S, typename T>
class STRef {
    std::shared_ptr<T> cell_;
    explicit STRef(T v) : cell_(std::make_shared<T>(std::move(v))) {}
    friend class STScope<S>;
public:
    const T& read() const { return *cell_; }
    void write(T v) const { *cell_ = std::move(v); }
};
template <typename S> class STScope {
    STScope() = default;
    template <typename F> friend auto run_st(F f);
public:
    template <typename T> STRef<S, T> new_ref(T v) const { return STRef<S, T>(std::move(v)); }
};

struct Tag1 {}; struct Tag2 {};

// Runs f with a fresh scope. If the result type depends on the scope tag (a reference
// escaping), instantiating with two different tags gives two different types: compile error.
template <typename F> auto run_st(F f) {
    using R1 = decltype(f(std::declval<const STScope<Tag1>&>()));
    using R2 = decltype(f(std::declval<const STScope<Tag2>&>()));
    static_assert(std::is_same_v<R1, R2>, "an STRef escaped its scope");
    return f(STScope<Tag1>{});
}

// a pure function that mutates internally: in-place quicksort on a private copy
std::vector<int> quicksort(std::vector<int> xs) {           // taken by value: our own copy
    std::function<void(int, int)> qs = [&](int lo, int hi) {
        if (lo >= hi) return;
        int pivot = xs[(lo + hi) / 2], i = lo, j = hi;
        while (i <= j) {
            while (xs[i] < pivot) ++i;
            while (xs[j] > pivot) --j;
            if (i <= j) std::swap(xs[i++], xs[j--]);
        }
        qs(lo, j); qs(i, hi);
    };
    qs(0, static_cast<int>(xs.size()) - 1);
    return xs;
}

int main() {
    assert(winner_msg(winner({"Ana", 3}, {"Bo", 5})) == "Bo wins");
    assert(winner_msg(winner({"Ana", 3}, {"Bo", 3})) == "It's a draw");

    // simple IO: building the program does nothing; running it does everything
    std::istringstream in("212\n");
    std::ostringstream out;
    input = &in; output = &out;
    auto program = simple::converter();
    assert(out.str().empty());
    program.unsafe_run();
    assert(out.str() == "Enter a temperature in degrees Fahrenheit:\n100.0 C\n");

    // naive IO: fine for small n; n = 1'000'000 would overflow the stack (not run here)
    assert(simple::count_down(1000).unsafe_run() == 0);

    // trampolined IO: a million steps, right- or left-nested, constant stack
    assert(tramp::count_down(1'000'000).unsafe_run() == 0);
    assert(tramp::left_nested(1'000'000).unsafe_run() == 1'000'000);
    int counter = 0;
    assert(tramp::repeat_until([&counter] { return ++counter; }, 500'000).unsafe_run() == 500'000);

    // ST: mutation inside, value out
    int r = run_st([](const auto& scope) {
        auto r1 = scope.new_ref(1);
        auto r2 = scope.new_ref(2);
        int x = r1.read(), y = r2.read();
        r1.write(y + 1);
        r2.write(x + 1);
        return r1.read() * 10 + r2.read();        // 3, 2 -> 32
    });
    assert(r == 32);
    // run_st([](const auto& scope) { return scope.new_ref(1); });   // does not compile: escaped
    assert((quicksort({5, 3, 9, 1, 3}) == std::vector{1, 3, 3, 5, 9}));

    std::cout.flush();
    output = &std::cout;
    contest({"Ana", 7}, {"Bo", 5});
    std::cout << "ch13 ok\n";
}
