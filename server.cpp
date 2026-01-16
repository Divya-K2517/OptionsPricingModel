#include "include/crow.h"
//#include "crow_all.h"
#include "OptionPricer.h"
#include hrono>
#include math>

OptionType parseOptionType(const std::string& s) {
    return (s == "put" || s == "PUT") ? OptionType::PUT : OptionType::CALL;
}

int main() {
    crow::SimpleApp app;

    //main pricing endpoint
    CROW_ROUTE(app, "/price").methods(crow::HTTPMethod::Post)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) {
            crow::response res(400);
            res.write("{\"error\":\"Invalid JSON\"}");
            return res;
        }

        //extract parameters
        double S     = body["spotPrice"].d(); //.d() is decimal
        double K     = body["strikePrice"].d();
        double T     = body["timeToMaturity"].d();
        double r     = body["riskFreeRate"].d();
        double sigma = body["volatility"].d();
        int    sims  = body["simulations"].i(); //.i() is integer
        std::string typeStr = body["optionType"].s(); //.s() is string

        OptionType type = parseOptionType(typeStr); //classify as call or put
        OptionPricer pricer(S, K, T, r, sigma); //initialize pricer

        auto t0 = std::chrono::high_resolution_clock::now();
        double bs = pricer.blackScholes(type); //exact price
        auto t1 = std::chrono::high_resolution_clock::now();

        auto t2 = std::chrono::high_resolution_clock::now();
        double mc = pricer.monteCarlo(type, sims, true); //mc price
        auto t3 = std::chrono::high_resolution_clock::now();

        Greeks g = pricer.calculateGreeks(type); //compute greeks

        //finding the time taken(in ms) for the black-scholes and monte-carlo methods
        //err is the absolute error between the two methods
        double bsMs = std::chrono::duration<double, std::milli>(t1 - t0).count();
        double mcMs = std::chrono::duration<double, std::milli>(t3 - t2).count();
        double err  = std::abs(bs - mc);

        //building response for frontend
        crow::json::wvalue out; 
        out["bsPrice"]          = bs;
        out["mcPrice"]          = mc;
        out["bsTimeMs"]         = bsMs;
        out["mcTimeMs"]         = mcMs;
        out["error"]            = err;
        out["relativeErrorPct"] = err / bs * 100.0;

        out["greeks"]["delta"]  = g.delta;
        out["greeks"]["gamma"]  = g.gamma;
        out["greeks"]["vega"]   = g.vega;
        out["greeks"]["theta"]  = g.theta;
        out["greeks"]["rho"]    = g.rho;

        crow::response res;
        res.code = 200;
        res.set_header("Content-Type", "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.write(out.dump());
        return res;
    });


    //second endpoint
    //for implied volatility calculation, where user provides a market price and asks for volatility
    CROW_ROUTE(app, "/implied-vol").methods(crow::HTTPMethod::Post)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body); //load JSON from request body
        if (!body) {
            crow::response res(400);
            res.write("{\"error\":\"Invalid JSON\"}");
            return res;
        }   

        //extract parameters
        double S      = body["spotPrice"].d();
        double K      = body["strikePrice"].d();
        double T      = body["timeToMaturity"].d();
        double r      = body["riskFreeRate"].d();
        double sigma0 = body.has("initialVol") ? body["initialVol"].d() : 0.2;
        double mkt    = body["marketPrice"].d();
        std::string typeStr = body["optionType"].s();

        OptionType type = parseOptionType(typeStr); //classify as call or put
        OptionPricer pricer(S, K, T, r, sigma0); //initialize pricer

        //calculate implied volatility
        double iv = pricer.impliedVolatility(mkt, type); 

        //building response for frontend
        crow::json::wvalue out; 
        out["impliedVol"] = iv;

        crow::response res;
        res.code = 200;
        res.set_header("Content-Type", "application/json");
        res.set_header("Access-Control-Allow-Origin", "*");
        res.write(out.dump());
        return res;
    });

    // // Preflight for CORS (optional if you stick to simple POSTs)
    // CROW_ROUTE(app, "/<path>")
    // ([](const crow::request& req, std::string) {
    //     if (req.method == crow::HTTPMethod::Options) {
    //         crow::response res;
    //         res.code = 204;
    //         res.set_header("Access-Control-Allow-Origin", "*");
    //         res.set_header("Access-Control-Allow-Headers", "Content-Type");
    //         res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
    //         return res;
    //     }
    //     return crow::response(404);
    // });

    app.port(8080).multithreaded().run(); //start server
}
