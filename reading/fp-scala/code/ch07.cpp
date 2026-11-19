// Chapter 7 · Designing a Library: Parallelism
// Build: g++ -std=c++23 -O2 -Wall -pthread ch07.cpp -o ch07 && ./ch07
#include <cassert>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <future>
#include <iostream>
#include <memory>
#include <mutex>
#include <numeric>
#include <optional>
#include <queue>
#include <span>
#include <thread>
#include <vector>

// ---- a minimal fixed-size thread pool (the "ExecutorService") ---------------
class ThreadPool {
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex m_;
    std::condition_variable cv_;
    bool stop_ = false;
public:
    explicit ThreadPool(size_t n) {
        for (size_t i = 0; i < n; ++i)
            workers_.emplace_back([this] {
                for (;;) {
                    std::function<void()> task;
                    {
                        std::unique_lock lk(m_);
                        cv_.wait(lk, [this] { return stop_ || !tasks_.empty(); });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
    }
    void submit(std::function<void()> t) {
        { std::lock_guard lk(m_); tasks_.push(std::move(t)); }
        cv_.notify_one();
    }
    ~ThreadPool() {
        { std::lock_guard lk(m_); stop_ = true; }
        cv_.notify_all();
        for (auto& w : workers_) w.join();
    }
};

// =====================================================================
// Version 1: blocking. Par<A> = pool -> future<A>
// =====================================================================
namespace blocking {
template <typename A> using Par = std::function<std::shared_future<A>(ThreadPool&)>;

template <typename A> Par<A> unit(A a) {
    return [a](ThreadPool&) { std::promise<A> p; p.set_value(a); return p.get_future().share(); };
}

template <typename A> Par<A> fork(std::function<Par<A>()> pa) {
    return [pa](ThreadPool& pool) {
        auto p = std::make_shared<std::promise<A>>();
        auto fut = p->get_future().share();
        pool.submit([pa, p, &pool] { p->set_value(pa()(pool).get()); });   // BLOCKS a pool thread
        return fut;
    };
}

template <typename A> Par<A> lazy_unit(std::function<A()> a) {
    return fork<A>([a] { return unit(a()); });
}

template <typename A, typename B, typename F>
auto map2(Par<A> pa, Par<B> pb, F f) -> Par<std::invoke_result_t<F, A, B>> {
    using C = std::invoke_result_t<F, A, B>;
    return [pa, pb, f](ThreadPool& pool) {
        auto fa = pa(pool);                 // start both BEFORE waiting on either
        auto fb = pb(pool);
        return std::async(std::launch::deferred, [fa, fb, f]() -> C { return f(fa.get(), fb.get()); }).share();
    };
}

Par<int> sum(std::span<const int> ints) {
    if (ints.size() <= 1) return unit(ints.empty() ? 0 : ints[0]);
    auto l = ints.first(ints.size() / 2), r = ints.subspan(ints.size() / 2);
    return map2(fork<int>([l] { return sum(l); }), fork<int>([r] { return sum(r); }), std::plus{});
}
}  // namespace blocking

// =====================================================================
// Version 2: non-blocking. A Par takes a callback instead of returning
// something you wait on. Nothing inside the pool ever blocks.
// =====================================================================
namespace nonblocking {
template <typename A> using Callback = std::function<void(A)>;
template <typename A> using Par = std::function<void(ThreadPool&, Callback<A>)>;

template <typename A> Par<A> unit(A a) { return [a](ThreadPool&, Callback<A> cb) { cb(a); }; }

template <typename A> Par<A> fork(std::function<Par<A>()> pa) {
    return [pa](ThreadPool& pool, Callback<A> cb) {
        pool.submit([pa, cb, &pool] { pa()(pool, cb); });       // no waiting
    };
}

template <typename A> Par<A> lazy_unit(std::function<A()> a) {
    return fork<A>([a] { return unit(a()); });
}

template <typename A, typename B, typename F>
auto map2(Par<A> pa, Par<B> pb, F f) -> Par<std::invoke_result_t<F, A, B>> {
    using C = std::invoke_result_t<F, A, B>;
    return [pa, pb, f](ThreadPool& pool, Callback<C> cb) {
        struct Pending { std::mutex m; std::optional<A> a; std::optional<B> b; };
        auto st = std::make_shared<Pending>();
        pa(pool, [st, f, cb](A a) {
            std::unique_lock lk(st->m);
            if (st->b) { auto b = *st->b; lk.unlock(); cb(f(a, b)); }   // second to arrive fires
            else st->a = a;
        });
        pb(pool, [st, f, cb](B b) {
            std::unique_lock lk(st->m);
            if (st->a) { auto a = *st->a; lk.unlock(); cb(f(a, b)); }
            else st->b = b;
        });
    };
}

template <typename A, typename F>
auto map(Par<A> pa, F f) -> Par<std::invoke_result_t<F, A>> {
    using B = std::invoke_result_t<F, A>;
    return [pa, f](ThreadPool& pool, Callback<B> cb) { pa(pool, [f, cb](A a) { cb(f(a)); }); };
}

// Only the top level blocks, once, outside the pool.
template <typename A> A run(ThreadPool& pool, Par<A> p) {
    std::promise<A> result;
    auto fut = result.get_future();
    p(pool, [&result](A a) { result.set_value(a); });
    return fut.get();
}

Par<int> sum(std::span<const int> ints) {
    if (ints.size() <= 1) return unit(ints.empty() ? 0 : ints[0]);
    auto l = ints.first(ints.size() / 2), r = ints.subspan(ints.size() / 2);
    return map2(fork<int>([l] { return sum(l); }), fork<int>([r] { return sum(r); }), std::plus{});
}

// Exercise 7.1
template <typename A, typename F> auto async_f(F f) {
    using B = std::invoke_result_t<F, A>;
    return [f](A a) { return lazy_unit<B>([f, a] { return f(a); }); };
}
template <typename A> Par<std::vector<A>> sequence(std::vector<Par<A>> ps) {
    Par<std::vector<A>> acc = unit(std::vector<A>{});
    for (auto it = ps.rbegin(); it != ps.rend(); ++it)
        acc = map2(*it, acc, [](A a, std::vector<A> v) { v.insert(v.begin(), a); return v; });
    return acc;
}
template <typename A, typename F> auto par_map(std::vector<A> as, F f) {
    using B = std::invoke_result_t<F, A>;
    std::vector<Par<B>> ps;
    for (auto& a : as) ps.push_back(async_f<A>(f)(a));
    return fork<std::vector<B>>([ps] { return sequence(ps); });
}

// 7.7: the result chooses the next computation
template <typename A, typename F>
auto flat_map(Par<A> pa, F f) -> std::invoke_result_t<F, A> {
    using PB = std::invoke_result_t<F, A>;
    return PB([pa, f](ThreadPool& pool, auto cb) { pa(pool, [f, cb, &pool](A a) { f(a)(pool, cb); }); });
}
template <typename A> Par<A> choice(Par<bool> cond, Par<A> t, Par<A> e) {
    return flat_map(cond, [t, e](bool b) { return b ? t : e; });
}
// Exercise 7.2
template <typename A> Par<A> join(Par<Par<A>> ppa) {
    return flat_map(ppa, [](Par<A> pa) { return pa; });
}
}  // namespace nonblocking

int main() {
    std::vector<int> v(64);
    std::iota(v.begin(), v.end(), 1);                     // 1..64, sum 2080

    {   // blocking version: works with plenty of threads...
        ThreadPool pool(256);
        assert(blocking::sum(v)(pool).get() == 2080);
    }
    {   // ...but the fork law fails on a pool of 1 thread: deadlock
        auto* pool = new ThreadPool(1);                    // deliberately leaked: its thread stays stuck
        auto p = blocking::fork<int>([] { return blocking::fork<int>([] { return blocking::unit(42); }); });
        auto fut = p(*pool);
        bool finished = fut.wait_for(std::chrono::milliseconds(300)) == std::future_status::ready;
        assert(!finished);                                 // deadlocked, as predicted
        std::cout << "blocking fork(fork(x)) on 1 thread: deadlocked (expected)" << std::endl;
    }
    {   // non-blocking version: the same programs on a single thread
        ThreadPool pool(1);
        using namespace nonblocking;
        assert(run(pool, fork<int>([] { return fork<int>([] { return unit(42); }); })) == 42);
        assert(run(pool, sum(v)) == 2080);
        auto squares = run(pool, par_map(std::vector{1, 2, 3, 4}, [](int x) { return x * x; }));
        assert((squares == std::vector{1, 4, 9, 16}));
        assert(run(pool, choice(unit(false), unit(1), unit(2))) == 2);
        assert(run(pool, join(unit(unit(7)))) == 7);
        assert(run(pool, map(unit(20), [](int x) { return x + 1; })) == 21);
    }
    {   // and on many threads
        ThreadPool pool(8);
        std::vector<int> big(10000, 1);
        assert(nonblocking::run(pool, nonblocking::sum(big)) == 10000);
    }
    std::cout << "ch07 ok" << std::endl;
    std::_Exit(0);   // skip static destruction; the leaked deadlocked pool is never joined
}
