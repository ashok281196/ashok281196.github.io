// Chapter 1 · What Functional Programming Actually Is
// Build: g++ -std=c++23 -O2 -Wall ch01.cpp -o ch01 && ./ch01
#include <cassert>
#include <iostream>
#include <map>
#include <numeric>
#include <optional>
#include <string>
#include <vector>

struct Ticket {
    std::string route;
    int price;
    bool operator==(const Ticket&) const = default;
};

// ---- impure version: booking and paying are fused ----------------------
struct PaymentGateway {
    void charge(const std::string& card, int amount) {
        std::cout << "[bank] charging " << card << " " << amount << "\n";   // side effect
    }
};

Ticket book_impure(const std::string& card, const std::string& route, PaymentGateway& gw) {
    Ticket t{route, 450};
    gw.charge(card, t.price);          // side effect hidden inside
    return t;
}

// ---- pure version: the charge is a value --------------------------------
struct Charge {
    std::string card;
    int amount;
    bool operator==(const Charge&) const = default;

    // Exercise 1.2: no throwing; the type says combining can fail
    std::optional<Charge> combine(const Charge& other) const {
        if (card != other.card) return std::nullopt;
        return Charge{card, amount + other.amount};
    }
};

struct Booking { Ticket ticket; Charge charge; };

Booking book(const std::string& card, const std::string& route) {
    Ticket t{route, 450};
    return {t, Charge{card, t.price}};
}

std::pair<std::vector<Ticket>, Charge> book_many(const std::string& card,
                                                 const std::string& route, int n) {
    std::vector<Ticket> tickets;
    Charge total{card, 0};
    for (int i = 0; i < n; ++i) {
        auto [t, c] = book(card, route);
        tickets.push_back(t);
        total = *total.combine(c);     // same card, so always present
    }
    return {tickets, total};
}

// merge a whole day's charges: one per card
std::vector<Charge> coalesce(const std::vector<Charge>& charges) {
    std::map<std::string, int> by_card;
    for (const auto& c : charges) by_card[c.card] += c.amount;
    std::vector<Charge> out;
    for (const auto& [card, amt] : by_card) out.push_back({card, amt});
    return out;
}

// Exercise 1.3: local mutation, still pure from the outside
int sum_to(int n) {
    int acc = 0;
    for (int i = 1; i <= n; ++i) acc += i;
    return acc;
}

int main() {
    PaymentGateway gw;
    book_impure("card-1", "BLR-JAI", gw);

    // testing the pure version is just equality: no mocks
    assert((book("c1", "BLR-JAI").charge == Charge{"c1", 450}));
    auto [tickets, total] = book_many("c1", "BLR-JAI", 4);
    assert(tickets.size() == 4 && total.amount == 1800);

    auto day = coalesce({{"a", 100}, {"b", 50}, {"a", 25}});
    assert(day.size() == 2 && day[0].amount == 125);

    assert((!Charge{"a", 1}.combine(Charge{"b", 1}).has_value()));
    assert(sum_to(10) == 55);

    // referential transparency: std::string is a value, std::string& append is not
    std::string x = "Hello";
    std::string r1(x.rbegin(), x.rend()), r2(x.rbegin(), x.rend());
    assert(r1 == r2);

    std::string sb = "Hello";
    std::string& y = sb.append(", World");
    std::string a = y;                 // "Hello, World"
    std::string b = sb.append(", World");   // substituting the expression changes the result
    assert(a != b);

    std::cout << "ch01 ok\n";
}
