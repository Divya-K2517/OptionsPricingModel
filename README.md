**Description:**
OptionsPricingModel is a production-grade option pricing engine that employs the Black-Scholes and Monte Carlo simulations to determine the price of an option. It also computes a full Greeks suite and has a implied volatility solver. Simply enter market data and get production-ready prices + risk metrics in under 50 milliseconds!

**What Do Traders Get?**
- Instant Pricing! Black Scholes prices are calculated in <1ms using the same formulas and logic as real world trading firms.
- Statistical Validation! The Monte Carlo simulation serves as a validator, simulating 10,000 market possibilties in 25ms with an error rate <0.3%
- Risk Analysis! Price isn't everything. All five Greeks(Δ, Γ, Θ, ν, ρ) are calculated to show you the sensitivity of your options price.
- Market Intelligence! Enter a price and get its implied volatility so you're never overpaying or underselling

**What do Engineers Get?**
- C++! The main engine is written in one of the fastest low-latency languages for true speed
- Scalable Design! The program can handle thousands of simulteanors traders through a multithreaded HTTP server
- Smart Math! Following formulas is the baseline. This program integrates certain optimization methods to compute values faster/in less iterations.

**How does Options Pricing actually work?**
This engine estimates how much an option is worth using two methods: an analytical model (Black–Scholes) and a simulation-based model (Monte Carlo). Simply put, Black–Scholes gives a quick, exact answer using a mathematic formula while Monte Carlo gives an estimated answer by simulating many “what if” price paths(ways the price could move).

Black-Scholes
The Black–Scholes model is a famous formula used to calculate fair prices for European call and put options. It assumes the stock price changes smoothly over time (like a random walk) with constant volatility and interest rates. This is called geometric Brownian motion. This gives us a closed-form solution, so you can plug in numbers and immediately get a price.

The formula:
C = S·N(d₁) - K·e⁻ʳᵀ·N(d₂)
d₁ = [ln(S/K) + (r + ½σ²)T] / (σ√T)
d₂ = d₁ - σ√T

The variables
S = Current stock price
K = Strike price (agreed exercise price)
r = Risk-free interest rate
T = Time to expiration (in years)
σ = Volatility (expected price fluctuation)
N(x) = Cumulative normal probability function
