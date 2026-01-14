// OptionPricer.h
#ifndef OPTION_PRICER_H
#define OPTION_PRICER_H

#include <vector>
#include <cmath>
#include <random>
#include <algorithm>
#include <numeric>

// Enum for option types - better than string comparisons
enum class OptionType {
    CALL, //buying
    PUT //selling
};

//holds Greeks - clean data structure
struct Greeks {
    double delta;
    double gamma;
    double vega;
    double theta;
    double rho;
};

// Main pricing class
class OptionPricer {
private:
    double S_;      //spot price, current price
    double K_;      //strike price, price to buy/sell
    double T_;      //time to maturity, time until option expires
    double r_;      //risk-free interest rate
    double sigma_;  //volatility
    
    //random number generator, is a class member for efficiency
    mutable std::mt19937 rng_;
    mutable std::normal_distribution<double> normal_dist_;
    
    //helper: Normal CDF using polynomial approximation
    double normalCDF(double x) const;
    
    //helper: Normal PDF
    double normalPDF(double x) const;
    
public:
    //constructor with member initializer list (efficient)
    OptionPricer(double S, double K, double T, double r, double sigma);
    
    //black-Scholes pricing
    double blackScholes(OptionType type) const;
    
    //Monte Carlo pricing with variance reduction
    double monteCarlo(OptionType type, int n_sims, bool use_antithetic = true) const;
    
    //analytical Greeks (exact, not numerical approximation)
    Greeks calculateGreeks(OptionType type) const;
    
    //implied volatility using Newton-Raphson
    double impliedVolatility(double market_price, OptionType type, 
                            double tolerance = 1e-6, int max_iter = 100) const;
    
    //getters
    double getSpot() const { return S_; }
    double getStrike() const { return K_; }
    double getTimeToMaturity() const { return T_; }
    double getRiskFreeRate() const { return r_; }
    double getVolatility() const { return sigma_; }
};

#endif // OPTION_PRICER_H