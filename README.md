💥**Description:**
OptionsPricingModel is a production-grade option pricing engine that employs the Black-Scholes and Monte Carlo simulations to determine the price of an option. It also computes a full Greeks suite and has a implied volatility solver. Simply enter market data and get production-ready prices + risk metrics in under 50 milliseconds!

📈**What Do Traders Get?**
- Instant Pricing! Black Scholes prices are calculated in <1ms using the same formulas and logic as real world trading firms.
- Statistical Validation! The Monte Carlo simulation serves as a validator, simulating 10,000 market possibilties in 25ms with an error rate <0.3% (Antithetic Variates help bring this error rate down!)
- Risk Analysis! Price isn't everything. All five Greeks(Δ, Γ, Θ, ν, ρ) are calculated to show you the sensitivity of your options price.
- Market Intelligence! Enter a price and get its implied volatility so you're never overpaying or underselling

💻**What do Engineers Get?**
- C++! The main engine is written in one of the fastest low-latency languages for true speed
- Scalable Design! The program can handle thousands of simulteanors traders through a multithreaded HTTP server
- Smart Math! Following formulas is the baseline. This program integrates certain optimization methods to compute values faster/in less iterations.

💡**How does Options Pricing actually work?**
This engine estimates how much an option is worth using two methods: an analytical model (Black–Scholes) and a simulation-based model (Monte Carlo). Simply put, Black–Scholes gives a quick, exact answer using a mathematic formula while Monte Carlo gives an estimated answer by simulating many “what if” price paths(ways the price could move).

🎯<ins>Black-Scholes</ins>
The Black–Scholes model is a famous formula used to calculate fair prices for European call and put options. It assumes the stock price changes smoothly over time (like a random walk) with constant volatility and interest rates. This is called geometric Brownian motion. This gives us a closed-form solution, so you can plug in numbers and immediately get a price.

The formula:
C = S·N(d₁) - K·e⁻ʳᵀ·N(d₂)
d₁ = [ln(S/K) + (r + ½σ²)T] / (σ√T)
d₂ = d₁ - σ√T

The variables:
S = Current stock price
K = Strike price (agreed exercise price)
r = Risk-free interest rate
T = Time to expiration (in years)
σ = Volatility (expected price fluctuation)
N(x) = Cumulative normal probability function

🎲<ins>Monte Carlo</ins>
This method doesnt use a single formula, but instead simulates thousands of possible future stock prices, essentially trying to cover every varisation of how the stock price could move through random sampling. This engine also uses Antithetic Variates to ensure high presicion. When generating random outcomes, it's possible that, by chance, we could end up with too many very high or very low numbers. Antithetic Variates is a method where for every +Z random price path, we also calculate the payoff for its opposite, -Z. These two opposite paths cancel out outliers and improve the accuracy of reuslting calculations. It then averages these results to get a single predicted payoff(expected profit/loss at the option's expiration), and discounts this value back to today's currency. 

The formula: 
Sₜ = S₀ · exp[(r − ½σ²)T + σ√T · Z]

The variables:
S₀ = Starting stock price
Sₜ = Simulated stock price at time T
Z = Random number from normal distribution
r = Risk-free interest rate
T = Time to expiration (in years)
σ = Volatility (expected price fluctuation)

❔What's the difference?
💬Monte Carlo pricing is slower, but much more flexible to different types of options with complex features or path-dependent payoffs(when the payoff is not just determined by the final price but also the path it took to get there). Black Scholes is much faster and gives an exact answer, but is limited to European-style options. 

<ins>Greeks</ins>
Greeks measure sensitivity of the option price to a number of different factors: time, interest, the stock price itself, volatility, etc. This allows traders to understand how much risk is involved in a certain position and determine how to manage it.

| Greeks | Definition | Question Equivalent |
| :-----------: | :-------------: | :------------: |
| Δ (Delta) | Sensitivity to stock price | "How much will the option's price change for every $1 change in the stock price?" |
| Γ (Gamma) | Sensitivity of delta to stock price | "How much will the delta change for every $1 change in the stock price?" |
| Θ (Theta) | Sensitivity to time | "How much does the option price change by each day?" |
| ν (Vega) | Sensitivity to volatility |"How much will the option's price change for every 1% change in the stock's volatility?" |
| ρ (Rho) | Sensitivity to interest rate | "How much will the option's price change for every 1% change in the risk-free interest rate?" |

References:
[https://en.wikipedia.org/wiki/Geometric_Brownian_motion](https://en.wikipedia.org/wiki/Geometric_Brownian_motion)
[https://www.investopedia.com/terms/m/montecarlosimulation.asp](https://www.investopedia.com/terms/m/montecarlosimulation.asp)
[https://medium.com/@benjihuser/an-introduction-and-step-by-step-guide-to-monte-carlo-simulations-4706f675a02f](https://medium.com/@benjihuser/an-introduction-and-step-by-step-guide-to-monte-carlo-simulations-4706f675a02f)

