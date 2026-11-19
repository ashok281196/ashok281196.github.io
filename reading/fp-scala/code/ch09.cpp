// Chapter 9 · Parser Combinators
// Build: g++ -std=c++23 -O2 -Wall ch09.cpp -o ch09 && ./ch09
#include <cassert>
#include <functional>
#include <iostream>
#include <memory>
#include <regex>
#include <string>
#include <string_view>
#include <utility>
#include <variant>
#include <vector>

// =====================================================================
// Representation (chosen LAST in the chapter; everything below the
// "derived" line only uses the primitives)
// =====================================================================
struct Location {
    std::string_view input;
    size_t offset = 0;
    int line() const { int l = 1; for (size_t i = 0; i < offset && i < input.size(); ++i) l += input[i] == '\n'; return l; }
    int col() const {
        auto nl = input.substr(0, offset).rfind('\n');
        return static_cast<int>(nl == std::string_view::npos ? offset + 1 : offset - nl);
    }
    Location advance(size_t n) const { return {input, offset + n}; }
};

struct ParseError {
    std::vector<std::pair<Location, std::string>> stack;
    std::string to_string() const {
        std::string s;
        for (auto& [loc, msg] : stack)
            s += std::to_string(loc.line()) + ":" + std::to_string(loc.col()) + " " + msg + "\n";
        return s;
    }
};

template <typename A> struct Success { A value; size_t consumed; };
struct Failure { ParseError error; bool committed; };
template <typename A> using Result = std::variant<Success<A>, Failure>;

template <typename A> using Parser = std::function<Result<A>(Location)>;

// ---- primitives ---------------------------------------------------------------
Parser<std::string> string(std::string w) {
    return [w](Location l) -> Result<std::string> {
        if (l.input.substr(l.offset).starts_with(w)) return Success<std::string>{w, w.size()};
        return Failure{{{{l, "expected \"" + w + "\""}}}, false};
    };
}

Parser<std::string> regex(std::string pattern) {
    auto re = std::make_shared<std::regex>(pattern);
    return [re, pattern](Location l) -> Result<std::string> {
        std::cmatch m;
        auto rest = l.input.substr(l.offset);
        if (std::regex_search(rest.data(), rest.data() + rest.size(), m, *re,
                              std::regex_constants::match_continuous))
            return Success<std::string>{m.str(), static_cast<size_t>(m.length())};
        return Failure{{{{l, "expected /" + pattern + "/"}}}, false};
    };
}

template <typename A> Parser<A> succeed(A a) {
    return [a](Location) -> Result<A> { return Success<A>{a, 0}; };
}

template <typename A> Parser<std::string> slice(Parser<A> p) {
    return [p](Location l) -> Result<std::string> {
        auto r = p(l);
        if (auto* s = std::get_if<Success<A>>(&r))
            return Success<std::string>{std::string(l.input.substr(l.offset, s->consumed)), s->consumed};
        return std::get<Failure>(r);
    };
}

// or: try p; only if it failed WITHOUT consuming input, try p2
template <typename A> Parser<A> operator|(Parser<A> p, Parser<A> p2) {
    return [p, p2](Location l) -> Result<A> {
        auto r = p(l);
        if (auto* f = std::get_if<Failure>(&r); f && !f->committed) return p2(l);
        return r;
    };
}

template <typename P> struct parser_value;
template <typename B> struct parser_value<Parser<B>> { using type = B; };

template <typename A, typename F>     // F: A -> Parser<B>
auto flat_map(Parser<A> p, F f) -> std::invoke_result_t<F, A> {
    using B = typename parser_value<std::invoke_result_t<F, A>>::type;
    return [p, f](Location l) -> Result<B> {
        auto r = p(l);
        auto* s = std::get_if<Success<A>>(&r);
        if (!s) return std::get<Failure>(r);
        auto r2 = f(s->value)(l.advance(s->consumed));
        if (auto* s2 = std::get_if<Success<B>>(&r2)) return Success<B>{std::move(s2->value), s->consumed + s2->consumed};
        auto fail = std::get<Failure>(r2);
        fail.committed = fail.committed || s->consumed > 0;     // consumed input -> committed
        return fail;
    };
}

template <typename A> Parser<A> attempt(Parser<A> p) {        // allow backtracking
    return [p](Location l) -> Result<A> {
        auto r = p(l);
        if (auto* f = std::get_if<Failure>(&r)) f->committed = false;
        return r;
    };
}
template <typename A> Parser<A> label(std::string msg, Parser<A> p) {   // replace the message
    return [msg, p](Location l) -> Result<A> {
        auto r = p(l);
        if (auto* f = std::get_if<Failure>(&r)) f->error.stack = {{f->error.stack.empty() ? l : f->error.stack.back().first, msg}};
        return r;
    };
}
template <typename A> Parser<A> scope(std::string msg, Parser<A> p) {   // add outer context
    return [msg, p](Location l) -> Result<A> {
        auto r = p(l);
        if (auto* f = std::get_if<Failure>(&r)) f->error.stack.insert(f->error.stack.begin(), {l, msg});
        return r;
    };
}

// a recursive grammar needs to refer to a parser before it is built
template <typename A> Parser<A> lazy(std::function<Parser<A>()> make) {
    auto cache = std::make_shared<Parser<A>>();
    return [make, cache](Location l) -> Result<A> {
        if (!*cache) *cache = make();
        return (*cache)(l);
    };
}

template <typename A> std::variant<A, ParseError> run(const Parser<A>& p, std::string_view input) {
    auto r = p(Location{input, 0});
    if (auto* s = std::get_if<Success<A>>(&r)) return s->value;
    return std::get<Failure>(r).error;
}

// =====================================================================
// Derived combinators: written only with the primitives above
// =====================================================================
template <typename A, typename F>
auto map(Parser<A> p, F f) -> Parser<std::invoke_result_t<F, A>> {
    using B = std::invoke_result_t<F, A>;
    return flat_map(p, [f](A a) { return succeed<B>(f(a)); });
}
template <typename A, typename B, typename F>
auto map2(Parser<A> pa, Parser<B> pb, F f) -> Parser<std::invoke_result_t<F, A, B>> {
    return flat_map(pa, [pb, f](A a) { return map(pb, [a, f](B b) { return f(a, b); }); });
}
template <typename A, typename B> Parser<std::pair<A, B>> product(Parser<A> pa, Parser<B> pb) {
    return map2(pa, pb, [](A a, B b) { return std::pair{a, b}; });
}
Parser<char> char_(char c) { return map(string(std::string(1, c)), [](std::string s) { return s[0]; }); }

// many: a loop rather than recursion, so long inputs don't overflow the stack
template <typename A> Parser<std::vector<A>> many(Parser<A> p) {
    return [p](Location l) -> Result<std::vector<A>> {
        std::vector<A> out;
        size_t total = 0;
        for (;;) {
            auto r = p(l.advance(total));
            if (auto* s = std::get_if<Success<A>>(&r)) {
                if (s->consumed == 0) break;           // guard against infinite loops
                out.push_back(std::move(s->value)); total += s->consumed;
            } else {
                auto& f = std::get<Failure>(r);
                if (f.committed) return f;
                break;
            }
        }
        return Success<std::vector<A>>{std::move(out), total};
    };
}
template <typename A> Parser<std::vector<A>> many1(Parser<A> p) {
    return map2(p, many(p), [](A a, std::vector<A> v) { v.insert(v.begin(), a); return v; });
}
template <typename A> Parser<std::vector<A>> list_of_n(int n, Parser<A> p) {
    if (n <= 0) return succeed(std::vector<A>{});
    return map2(p, list_of_n(n - 1, p), [](A a, std::vector<A> v) { v.insert(v.begin(), a); return v; });
}

// keep only the right / left result of a sequence
template <typename A, typename B> Parser<B> skip_l(Parser<A> pa, Parser<B> pb) {
    return map2(slice(pa), pb, [](std::string, B b) { return b; });
}
template <typename A, typename B> Parser<A> skip_r(Parser<A> pa, Parser<B> pb) {
    return map2(pa, slice(pb), [](A a, std::string) { return a; });
}
Parser<std::string> whitespace() { return regex("\\s*"); }
template <typename A> Parser<A> token(Parser<A> p) { return skip_r(p, whitespace()); }
Parser<std::string> tok(std::string s) { return token(string(std::move(s))); }
template <typename A, typename B> Parser<A> as(Parser<B> p, A a) { return map(slice(p), [a](std::string) { return a; }); }

template <typename A, typename S> Parser<std::vector<A>> sep(Parser<A> p, Parser<S> separator) {
    return map2(p, many(skip_l(separator, p)), [](A a, std::vector<A> v) { v.insert(v.begin(), a); return v; })
         | succeed(std::vector<A>{});
}
template <typename A, typename O, typename C> Parser<A> surround(Parser<O> open, Parser<C> close, Parser<A> p) {
    return skip_r(skip_l(open, p), close);
}

// context-sensitive: a digit n, then exactly n 'a's
Parser<int> counted_as() {
    return flat_map(regex("[0-9]"), [](std::string d) {
        int n = d[0] - '0';
        return map(list_of_n(n, char_('a')), [n](std::vector<char>) { return n; });
    });
}

// =====================================================================
// A JSON parser, written only against the combinators
// =====================================================================
struct JSON {
    std::variant<std::nullptr_t, double, std::string, bool,
                 std::vector<JSON>, std::vector<std::pair<std::string, JSON>>> v;
};

Parser<JSON> json_value();

Parser<std::string> quoted() { return skip_r(skip_l(string("\""), regex("[^\"]*")), tok("\"")); }

Parser<JSON> json_literal() {
    return as(tok("null"), JSON{nullptr})
         | as(tok("true"), JSON{true})
         | as(tok("false"), JSON{false})
         | map(token(regex("-?[0-9]+(\\.[0-9]+)?([eE][-+]?[0-9]+)?")), [](std::string s) { return JSON{std::stod(s)}; })
         | map(quoted(), [](std::string s) { return JSON{s}; });
}
Parser<JSON> json_array() {
    return scope("array", map(surround(tok("["), tok("]"), sep(json_value(), tok(","))),
                              [](std::vector<JSON> vs) { return JSON{vs}; }));
}
Parser<JSON> json_object() {
    auto keyval = product(quoted(), skip_l(tok(":"), json_value()));
    return scope("object", map(surround(tok("{"), tok("}"), sep(keyval, tok(","))),
                               [](std::vector<std::pair<std::string, JSON>> kvs) { return JSON{kvs}; }));
}
Parser<JSON> json_value() {
    return lazy<JSON>([] { return json_literal() | json_object() | json_array(); });
}
Parser<JSON> json() { return skip_l(whitespace(), json_value()); }

int main() {
    assert(std::get<std::string>(run(string("abra"), "abracadabra")) == "abra");
    assert((std::holds_alternative<ParseError>(run(string("abra"), "cadabra"))));
    assert(std::get<int>(run(map(slice(many(char_('a'))), [](std::string s) { return (int)s.size(); }), "aaab")) == 3);
    assert(std::get<int>(run(counted_as(), "3aaa")) == 3);
    assert((std::holds_alternative<ParseError>(run(counted_as(), "3aa"))));

    // committed vs attempt
    auto ab_cd = product(string("abra"), string("cadabra"));
    auto other = map(string("abraxyz"), [](std::string s) { return std::pair{s, std::string()}; });
    assert((std::holds_alternative<ParseError>(run(ab_cd | other, "abraxyz"))));      // committed: no retry
    assert((!std::holds_alternative<ParseError>(run(attempt(ab_cd) | other, "abraxyz"))));

    auto doc = run(json(), R"( { "robot": "PiPER", "dof": 6, "arms": [1, 2.5, true, null], "ok": false } )");
    auto& obj = std::get<std::vector<std::pair<std::string, JSON>>>(std::get<JSON>(doc).v);
    assert(obj.size() == 4 && obj[0].first == "robot");
    assert(std::get<std::string>(obj[0].second.v) == "PiPER");
    assert(std::get<double>(obj[1].second.v) == 6);
    assert(std::get<std::vector<JSON>>(obj[2].second.v).size() == 4);

    auto bad = run(json(), R"({ "a": [1, 2 })");
    assert(std::holds_alternative<ParseError>(bad));
    std::cout << std::get<ParseError>(bad).to_string();

    // a long array: many is a loop, so no stack overflow
    std::string big = "[";
    for (int i = 0; i < 20000; ++i) big += (i ? ",1" : "1");
    big += "]";
    assert(std::get<std::vector<JSON>>(std::get<JSON>(run(json(), big)).v).size() == 20000);

    std::cout << "ch09 ok\n";
}
