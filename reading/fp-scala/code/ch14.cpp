// Chapter 14 · Streaming I/O
// Build: g++ -std=c++23 -O2 -Wall ch14.cpp -o ch14 && ./ch14
#include <cassert>
#include <cstdio>
#include <fstream>
#include <functional>
#include <iostream>
#include <memory>
#include <optional>
#include <ranges>
#include <sstream>
#include <string>
#include <variant>
#include <vector>

// =====================================================================
// A stream transducer: a little state machine that, at each step,
// emits an output, asks for the next input, or halts.
// =====================================================================
template <typename I, typename O> struct PNode;
template <typename I, typename O> struct Process { std::shared_ptr<const PNode<I, O>> node; };

template <typename I, typename O> struct PNode {
    struct Emit  { O head; Process<I, O> tail; };
    struct Await { std::function<Process<I, O>(std::optional<I>)> recv; };   // nullopt = input exhausted
    struct Halt  {};
    std::variant<Emit, Await, Halt> v;
};

template <typename I, typename O> Process<I, O> halt() {
    return {std::make_shared<const PNode<I, O>>(PNode<I, O>{typename PNode<I, O>::Halt{}})};
}
template <typename I, typename O> Process<I, O> emit(O h, Process<I, O> tail = halt<I, O>()) {
    return {std::make_shared<const PNode<I, O>>(PNode<I, O>{typename PNode<I, O>::Emit{std::move(h), std::move(tail)}})};
}
template <typename I, typename O> Process<I, O> await(std::function<Process<I, O>(std::optional<I>)> f) {
    return {std::make_shared<const PNode<I, O>>(PNode<I, O>{typename PNode<I, O>::Await{std::move(f)}})};
}

// ---- building blocks ---------------------------------------------------------------
template <typename I, typename F> auto lift(F f) -> Process<I, std::invoke_result_t<F, I>> {
    using O = std::invoke_result_t<F, I>;
    return await<I, O>([f](std::optional<I> i) -> Process<I, O> {
        if (!i) return halt<I, O>();
        return emit<I, O>(f(*i), lift<I>(f));          // emit, then repeat
    });
}
template <typename I, typename P> Process<I, I> filter(P p) {
    return await<I, I>([p](std::optional<I> i) -> Process<I, I> {
        if (!i) return halt<I, I>();
        return p(*i) ? emit<I, I>(*i, filter<I>(p)) : filter<I>(p);
    });
}
template <typename I> Process<I, I> take(int n) {
    if (n <= 0) return halt<I, I>();
    return await<I, I>([n](std::optional<I> i) -> Process<I, I> {
        if (!i) return halt<I, I>();
        return emit<I, I>(*i, take<I>(n - 1));
    });
}
template <typename I> Process<I, int> count(int n = 0) {
    return await<I, int>([n](std::optional<I> i) -> Process<I, int> {
        if (!i) return halt<I, int>();
        return emit<I, int>(n + 1, count<I>(n + 1));
    });
}
template <typename I, typename P> Process<I, bool> exists(P p) {    // emits once, then halts
    return await<I, bool>([p](std::optional<I> i) -> Process<I, bool> {
        if (!i) return emit<I, bool>(false);
        return p(*i) ? emit<I, bool>(true) : exists<I>(p);
    });
}

// ---- pipe: feed the output of p1 into p2 ------------------------------------------------
template <typename I, typename M, typename O>
Process<I, O> operator|(Process<I, M> p1, Process<M, O> p2) {
    using N2 = PNode<M, O>;
    using N1 = PNode<I, M>;
    if (std::holds_alternative<typename N2::Halt>(p2.node->v)) return halt<I, O>();      // downstream done: stop upstream
    if (auto* e = std::get_if<typename N2::Emit>(&p2.node->v)) return emit<I, O>(e->head, p1 | e->tail);
    auto& recv = std::get<typename N2::Await>(p2.node->v).recv;                          // p2 wants input
    if (auto* e = std::get_if<typename N1::Emit>(&p1.node->v)) return e->tail | recv(e->head);
    if (std::holds_alternative<typename N1::Halt>(p1.node->v)) return halt<I, M>() | recv(std::nullopt);
    auto g = std::get<typename N1::Await>(p1.node->v).recv;                              // both wait: ask for input
    return await<I, O>([g, p2](std::optional<I> i) { return g(i) | p2; });
}

// ---- drivers -------------------------------------------------------------------------------
// run a process against any pull function: () -> optional<I>
template <typename I, typename O, typename Pull>
std::vector<O> drive(Process<I, O> p, Pull&& pull) {
    using N = PNode<I, O>;
    std::vector<O> out;
    for (;;) {
        if (auto* e = std::get_if<typename N::Emit>(&p.node->v)) { out.push_back(e->head); auto t = e->tail; p = t; }
        else if (auto* a = std::get_if<typename N::Await>(&p.node->v)) { auto next = a->recv(pull()); p = next; }
        else return out;                                     // halted: stop pulling
    }
}
template <typename I, typename O> std::vector<O> run_on(Process<I, O> p, const std::vector<I>& in) {
    size_t i = 0;
    return drive(p, [&]() -> std::optional<I> { if (i < in.size()) return in[i++]; return std::nullopt; });
}

// =====================================================================
// Effectful source with resource safety: the file is owned by the source,
// and closed when the run ends, however it ends.
// =====================================================================
struct FileLog { int opened = 0, closed = 0, lines_read = 0; };

class LineSource {
    struct Handle {
        std::ifstream in;
        FileLog* log;
        Handle(const std::string& path, FileLog* l) : in(path), log(l) { ++log->opened; }
        ~Handle() { ++log->closed; }                       // RAII release
    };
    std::unique_ptr<Handle> h_;
public:
    LineSource(const std::string& path, FileLog* log) : h_(std::make_unique<Handle>(path, log)) {}
    std::optional<std::string> operator()() {
        std::string line;
        if (h_ && std::getline(h_->in, line)) { ++h_->log->lines_read; return line; }
        return std::nullopt;
    }
};

// run a pipeline over a file's lines; the source (and file) lives exactly as long as the run
template <typename O>
std::vector<O> run_file(const std::string& path, Process<std::string, O> p, FileLog* log) {
    LineSource src(path, log);
    return drive(p, src);
}                                                          // file closed here, early stop or not

int main() {
    std::vector<int> xs{1, 2, 3, 4, 5, 6};
    assert((run_on(filter<int>([](int x) { return x % 2 == 0; }), xs) == std::vector{2, 4, 6}));
    assert((run_on(take<int>(2), xs) == std::vector{1, 2}));
    assert((run_on(count<int>(), xs).back() == 6));

    // composition with pipe: each element flows through the whole pipeline
    auto pipeline = lift<int>([](int x) { return x + 10; })
                  | filter<int>([](int x) { return x % 2 == 0; })
                  | take<int>(2);
    assert((run_on(pipeline, xs) == std::vector{12, 14}));

    // early termination: exists stops pulling as soon as it knows the answer
    int pulled = 0;
    auto found = drive(exists<int>([](int x) { return x > 2; }),
                       [&]() -> std::optional<int> { return ++pulled; });   // an INFINITE source
    assert(found == std::vector{true} && pulled == 3);

    // a file with 50,000 lines (some blank)
    std::string path = "/tmp/fp_ch14_big.log";
    { std::ofstream f(path); for (int i = 0; i < 50000; ++i) f << (i % 10 == 0 ? "" : "line " + std::to_string(i)) << "\n"; }

    auto more_than_40k_nonblank = filter<std::string>([](const std::string& s) { return !s.empty(); })
                                | count<std::string>()
                                | exists<int>([](int n) { return n > 40000; });
    FileLog log;
    auto r = run_file(path, more_than_40k_nonblank, &log);
    assert(r == std::vector{true});
    assert(log.opened == 1 && log.closed == 1);
    assert(log.lines_read < 50000);                         // stopped early...
    std::cout << "read " << log.lines_read << " of 50000 lines, file closed: " << (log.closed == 1) << "\n";

    FileLog log2;
    auto first3 = run_file(path, filter<std::string>([](const std::string& s) { return !s.empty(); }) | take<std::string>(3), &log2);
    assert(first3.size() == 3 && log2.closed == 1 && log2.lines_read == 4);   // ...and still closed the file

    FileLog log3;
    auto none = run_file(path, exists<std::string>([](const std::string& s) { return s == "nope"; }), &log3);
    assert(none == std::vector{false} && log3.lines_read == 50000 && log3.closed == 1);

    std::remove(path.c_str());
    std::cout << "ch14 ok\n";
}
