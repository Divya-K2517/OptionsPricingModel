#include "OptionPricer.h"

//constructor: initialize random number generator
OptionPricer::OptionPricer(double S, double K, double T, double r, double sigma)
    : S_(S), K_(K), T_(T), r_(r), sigma_(sigma),
      rng_(std::random_device{}()),  //produces a seed from hardware
      normal_dist_(0.0, 1.0)         //normal distrubution with mean 0 and stddev 1
{
}

//Abramowitz & Stegun approximation for Normal CDF
//CDF = cumulative distribution function

double OptionPricer::normalCDF(double x) const {
    // Constants from A&S formula 26.2.17
    const double a1 =  0.31938153;
    const double a2 = -0.356563782;
    const double a3 =  1.781477937;
    const double a4 = -1.821255978;
    const double a5 =  1.330274429;
    const double k = 1.0 / (1.0 + 0.2316419 * std::abs(x));
    
    const double cdf = 1.0 - (1.0 / std::sqrt(2.0 * M_PI)) * 
                       std::exp(-0.5 * x * x) *
                       (a1*k + a2*k*k + a3*k*k*k + a4*k*k*k*k + a5*k*k*k*k*k);
    
    return x < 0 ? 1.0 - cdf : cdf;
}

//normal PDF: φ(x) = (1/√2π)e^(-x²/2)
//PDF = probability density function
//how probability is distributed over difference values of a random variable
double OptionPricer::normalPDF(double x) const {
    return (1.0 / std::sqrt(2.0 * M_PI)) * std::exp(-0.5 * x * x);
}

//black-Scholes formula - closed form solution
double OptionPricer::blackScholes(OptionType type) const {
    //calculate d1 and d2
    const double d1 = (std::log(S_ / K_) + (r_ + 0.5 * sigma_ * sigma_) * T_) / 
                      (sigma_ * std::sqrt(T_));
    const double d2 = d1 - sigma_ * std::sqrt(T_);
    //d1 is a measure of how sensitive the option price is to changes in the stock price
    //d2 is how likely it is that the option has positive value/payoff at maturity

    //discount factor: e^(-rT)
    //risk-free interest rate and time to maturity
    const double discount = std::exp(-r_ * T_);
    
    if (type == OptionType::CALL) {
        //S * normalCDF(d1) => expected benefit of buying the stock outright
        //K * Math.exp(-r * T) * normalCDF(d2) => present value of paying the strike price at maturity
        //(benefit from buying stock right now) - (cost of exercising option at maturity)
        return S_ * normalCDF(d1) - K_ * discount * normalCDF(d2);
    } else {
        return K_ * discount * normalCDF(-d2) - S_ * normalCDF(-d1);
    }
}

//Monte Carlo with antithetic variance reduction
double OptionPricer::monteCarlo(OptionType type, int n_sims, bool use_antithetic) const {
    //when use_antithetic is true, we use antithetic variates to reduce variance and improve accuracy
        //this means for every random normal variable Z we generate, we also use -Z to simulate another path

    double sum_payoff = 0.0; //running total of the payoffs from each simulation
    const int actual_sims = use_antithetic ? n_sims / 2 : n_sims; //number of simulations to run
    
    //pre-calculate constants, so its not done for every simulation
    const double drift = (r_ - 0.5 * sigma_ * sigma_) * T_; //growth of an option price over time
    const double diffusion = sigma_ * std::sqrt(T_); //volatility over time - small diffusion means price stays close to expected value, vice versa
    const double discount = std::exp(-r_ * T_); //used to convert future prices into present value
    
    for (int i = 0; i < actual_sims; ++i) {
        //generate random normal variable
        double Z = normal_dist_(rng_);
        
        //simulate final stock price using GBM
        double ST = S_ * std::exp(drift + diffusion * Z);
        
        //calculate payoff
        double payoff;
        if (type == OptionType::CALL) {
            //if ST>K, then payoff is ST-K and you can buy at K and sell at ST, else 0
            payoff = std::max(ST - K_, 0.0);
        } else {
            payoff = std::max(K_ - ST, 0.0);
        }
        sum_payoff += payoff;
        
        //antithetic variate: use -Z for variance reduction
        if (use_antithetic) {
            double ST_anti = S_ * std::exp(drift + diffusion * (-Z));
            double payoff_anti;
            if (type == OptionType::CALL) {
                payoff_anti = std::max(ST_anti - K_, 0.0);
            } else {
                payoff_anti = std::max(K_ - ST_anti, 0.0);
            }
            sum_payoff += payoff_anti;
        }
    }
    
    //return discounted average
    const int total_paths = use_antithetic ? n_sims : actual_sims;
    return discount * (sum_payoff / total_paths); //discount * average payoff
}

//analytical greeks, measures of sensitivity to different things

Greeks OptionPricer::calculateGreeks(OptionType type) const {
    Greeks greeks;
    
    //calculate d1 and d2 (same as before)
    const double d1 = (std::log(S_ / K_) + (r_ + 0.5 * sigma_ * sigma_) * T_) / 
                      (sigma_ * std::sqrt(T_));
    const double d2 = d1 - sigma_ * std::sqrt(T_);
    
    const double discount = std::exp(-r_ * T_);
    const double sqrt_T = std::sqrt(T_);
    
    //delta: ∂V/∂S, sensitivity to stock price
    if (type == OptionType::CALL) {
        greeks.delta = normalCDF(d1);
    } else {
        greeks.delta = normalCDF(d1) - 1.0;
    }
    
    //gamma: ∂²V/∂S² (same for calls and puts), sensitivity of delta to stock price
    //high gamma means delta changes rapidly with stock price, low gamma means delta is stable
    greeks.gamma = normalPDF(d1) / (S_ * sigma_ * sqrt_T);
    
    //vega: ∂V/∂σ (same for calls and puts), sensitivity to volatility
    //how option price changes with every 1% volatility increase
    greeks.vega = S_ * normalPDF(d1) * sqrt_T;
    
    //theta: ∂V/∂t, sensitivity to time
    //how much value the option loses per day
    const double theta_common = -(S_ * normalPDF(d1) * sigma_) / (2.0 * sqrt_T);
    if (type == OptionType::CALL) {
        greeks.theta = theta_common - r_ * K_ * discount * normalCDF(d2);
    } else {
        greeks.theta = theta_common + r_ * K_ * discount * normalCDF(-d2);
    }
    //convert to per-day
    greeks.theta /= 365.0;
    
    //rho: ∂V/∂r, sensitivity to interest rate
    if (type == OptionType::CALL) {
        greeks.rho = K_ * T_ * discount * normalCDF(d2);
    } else {
        greeks.rho = -K_ * T_ * discount * normalCDF(-d2);
    }
    //convert to per 1% change
    greeks.rho /= 100.0;
    
    return greeks;
}

//newton-Raphson for implied volatility
//reverse engineer volatility from market price
double OptionPricer::impliedVolatility(double market_price, OptionType type, 
                                       double tolerance, int max_iter) const {
    //tolerance: how close to the market price we need to be
    //max_iter: maximum number of iterations to prevent infinite loops
    
    //initial guess: at the money(ATM) implied vol approximation
    double sigma_guess = std::sqrt(2.0 * M_PI / T_) * (market_price / S_);
    
    for (int i = 0; i < max_iter; ++i) {
        //create temporary pricer with guessed volatility
        OptionPricer temp_pricer(S_, K_, T_, r_, sigma_guess);
        
        //calculate price and vega with current guess
        double price = temp_pricer.blackScholes(type);
        Greeks greeks = temp_pricer.calculateGreeks(type);
        
        //price difference
        double diff = price - market_price;
        
        //check convergence, if within tolerance, return guess
        if (std::abs(diff) < tolerance) {
            return sigma_guess;
        }
        
        //Newton-Raphson update: σ_new = σ_old - f(σ)/f'(σ)
        //f(σ) = BS_price(σ) - market_price
        //f'(σ) = vega
        sigma_guess -= diff / greeks.vega;
        
        //ensure volatility stays positive
        sigma_guess = std::max(sigma_guess, 1e-6);
    }
    
    return sigma_guess;  //return best guess if didn't converge
}

