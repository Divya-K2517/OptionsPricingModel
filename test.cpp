// Example usage and testing
#include <iostream>
#include <iomanip>
#include <chrono>

void printGreeks(const Greeks& g) {
    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Delta: " << g.delta << "\n";
    std::cout << "Gamma: " << g.gamma << "\n";
    std::cout << "Vega:  " << g.vega << "\n";
    std::cout << "Theta: " << g.theta << " (per day)\n";
    std::cout << "Rho:   " << g.rho << " (per 1%)\n";
}

int main() {
    // Test parameters
    double S = 100.0;     // Spot price
    double K = 100.0;     // Strike (ATM)
    double T = 1.0;       // 1 year
    double r = 0.05;      // 5% risk-free rate
    double sigma = 0.2;   // 20% volatility
    
    OptionPricer pricer(S, K, T, r, sigma);
    
    std::cout << "=== OPTION PRICING ENGINE ===\n\n";
    std::cout << "Parameters:\n";
    std::cout << "Spot: $" << S << ", Strike: $" << K << "\n";
    std::cout << "Time: " << T << " years, Rate: " << r*100 << "%\n";
    std::cout << "Volatility: " << sigma*100 << "%\n\n";
    
    // Black-Scholes pricing
    double call_bs = pricer.blackScholes(OptionType::CALL);
    double put_bs = pricer.blackScholes(OptionType::PUT);
    
    std::cout << "BLACK-SCHOLES PRICES:\n";
    std::cout << "Call: $" << call_bs << "\n";
    std::cout << "Put:  $" << put_bs << "\n\n";
    
    // Monte Carlo with timing
    auto start = std::chrono::high_resolution_clock::now();
    double call_mc = pricer.monteCarlo(OptionType::CALL, 1000000, true);
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    
    std::cout << "MONTE CARLO (1M simulations with antithetic variance reduction):\n";
    std::cout << "Call: $" << call_mc << "\n";
    std::cout << "Error: $" << std::abs(call_mc - call_bs) << "\n";
    std::cout << "Time: " << duration.count() << " ms\n\n";
    
    // Greeks
    std::cout << "GREEKS (Call Option):\n";
    Greeks call_greeks = pricer.calculateGreeks(OptionType::CALL);
    printGreeks(call_greeks);
    
    std::cout << "\nGREEKS (Put Option):\n";
    Greeks put_greeks = pricer.calculateGreeks(OptionType::PUT);
    printGreeks(put_greeks);
    
    // Implied volatility
    std::cout << "\n=== IMPLIED VOLATILITY ===\n";
    double market_price = 10.45;  // Suppose this is market price
    double implied_vol = pricer.impliedVolatility(market_price, OptionType::CALL);
    std::cout << "Market Price: $" << market_price << "\n";
    std::cout << "Implied Vol:  " << implied_vol*100 << "%\n";
    std::cout << "Input Vol:    " << sigma*100 << "%\n";
    
    return 0;
}