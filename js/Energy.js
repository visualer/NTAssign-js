
'use strict';

const AssignResult = {
    accurate : 0,
    possible : 1,
    impossible : 2,
    error : 3
};

const typeArr = [
    "Air-suspended SWNTs", "SWNTs on \\(\\mathrm{SiO_2}/\\mathrm{Si}\\) substrates", "SWNT arrays on quartz substrates",
    "\"Super-growth\" SWNTs", "SDS-dispersed SWNTs", "ssDNA-dispersed SWNTs"
];
const param = [
    [ 1.079, 0.077, 0.063 ],
    [ 2.022, 0.308, 0.172 ],
    [ 3.170, 0.764, 0.286 ], //M11
    [ 4.286, 1.230, 0.412 ],
    [ 5.380, 1.922, 0.644 ],
    [ 6.508, 2.768, 0.928 ], //M22
    [ 7.624, 3.768, 1.024 ], //S55
    [ 8.734, 4.921, 1.479 ], //S66
    [ 9.857, 6.228, 1.692 ]  //M33
];
const betap =[
    [ 0.09, -0.07 ],
    [ -0.18, 0.14 ],
    [ -0.19, 0.29 ],
    [ 0.49, -0.33 ],
    [ -0.43, 0.59 ],
    [ -0.6, 0.57 ]
];

const p1Arr = [
    "\\(S_{11}\\)", "\\(S_{22}\\)", "\\(M_{11}^-\\)", "\\(M_{11}^+\\)", "\\(S_{33}\\)", "\\(S_{44}\\)",
    "\\(M_{22}^-\\)", "\\(M_{22}^+\\)", "\\(S_{55}\\)", "\\(S_{66}\\)", "\\(M_{33}^-\\)", "\\(M_{33}^+\\)"
];

const p1Arr_raw = [
    "S_{11}", "S_{22}", "M_{11}^-", "M_{11}^+", "S_{33}", "S_{44}", "M_{22}^-", "M_{22}^+", "S_{55}", "S_{66}",
    "M_{33}^-", "M_{33}^+"
];

const p1ToP = [ 0, 1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8 ];
const pToLesser = [ 0, 0, 2, 3, 3, 5, 6, 6, 9 ];
const p1ToLesser = (p1) => p1 % 2 === 0 ? p1 : p1 - 1;

const Dt = (n, m, type) => ((type !== 4) ? 0.142 : 0.144) * Math.sqrt(3 * (n * n + n * m + m * m)) / Math.PI;
const Theta = (n, m) => Math.atan(Math.sqrt(3) * m / (2 * n + m));
const Mod = (n, m) => (2 * n + m) % 3;
const isMetalP = (p) => (p + 1) % 3 === 0;
const isMetalNM = (n, m) => Mod(n, m) === 0;
const isMetal = function () { return arguments.length === 2 ?
    isMetalNM(arguments[0], arguments[1]) :
    isMetalP(arguments[0]); };

function getRBMParameters(p, type) {
    function Param(a, b) { this.a = a; this.b = b; }
    switch (type) {
        case 0: switch (p) {
                case 0: case 1: return new Param(204, 27);
                case 2: return new Param(200, 26);
                default: return new Param(228, 0);
        }
        case 1: return new Param(235.9, 5.5);
        case 2: return new Param(217.8, 15.7);
        case 3: return new Param(227.0, 0.3);
        case 4: return new Param(223.5, 12.5);
        case 5: return new Param(218, 18.3);
        default: throw new Error("invalid type");
    }
}

function wRBM2Dt(wRBM, p, type) {
    let ab = getRBMParameters(p, type);
    return ab.a / (wRBM - ab.b);
}

function dt2RBM(dt, p, type) {
    let ab = getRBMParameters(p, type);
    return ab.a / dt + ab.b;
}

const getEnergy = (dt, theta, p, type, mod) => getEnergyFromCos3Theta(dt, Math.cos(3 * theta), p, type, mod);

function getEnergyFromCos3Theta(dt, cos3Theta, p, type, mod)
{
    let r; // return value
    if (isMetal(p) && mod > 0)
        throw new Error("mod should be in accordance with p");
    if (type <= 2) {

        if (p >= 9)
            throw new Error("higher than S66 not available");
        let derivative = -param[p][0] / (dt * dt) + 2 * param[p][1] / (dt * dt * dt);
        if (derivative > 0) // 1st derivative
            throw new Error("dt");
        if (isMetal(p))
            r = param[p][0] / dt - param[p][1] / (dt * dt) + param[p][2] / (dt * dt) * cos3Theta * (mod * 2 + 1);
        // mod * 2 + 1 <==> mod === 0 ? 1 : -1
        else
            r = param[p][0] / dt - param[p][1] / (dt * dt) +
                param[p][2] / (dt * dt) * cos3Theta * (((p % 3) === (mod % 2)) ? -1 : 1);
        r -= (type === 1) ? 0.04 : ((type === 2) ? 0.1 : 0);

    } else if (type === 3) {

        if (p >= 6)
            throw new Error("higher than M22 not available for Super-Growth");
        let a = 1.074, b = 0.467, c = 0.812;
        let sgE = (extMod) => a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt)))
            + betap[p][extMod] / (dt * dt) * cos3Theta
            + ((p > 2) ? 0.059 * (p + 1) / dt : 0); // extra for larger than M11; warning: p + 1
        if (isMetal(p))
            r = sgE(mod + 1); // 0(Mii+) -> 1, -1(Mii-) -> 0
        else
            r = sgE(mod - 1); // 1(MOD1) -> 0, 2(MOD2) -> 1

    } else if (type === 4 || type === 5) {

        if (p === 0)
            r = 1 / (0.1270 + 0.8606 * dt) + ((mod === 1) ? 0.04575 : -0.08802) / (dt * dt) * cos3Theta;
        else if (p === 1)
            r = 1 / (0.1174 + 0.4644 * dt) + ((mod === 1) ? -0.1829 : 0.1705) / (dt * dt) * cos3Theta;
        else
            throw new Error("only S11 and S22 are available for SDS-dispersed or ssDNA dispersed");
        r -= (type === 5) ? 0.02 : 0;

    } else throw new Error("invalid type");

    return r;
}

function getCos3Theta(val, dt, p, type) {

    // returns cos3Theta as [val_modLesser, val_modLarger]

    let r = [-1, -1];

    if (type <= 2) {

        if (p >= 9)
            throw new Error("higher than S66 not available");
        val += (type === 1) ? 0.04 : ((type === 2) ? 0.1 : 0);
        if (isMetal(p)) {
            r[0] = (param[p][0] / dt - param[p][1] / (dt * dt) - val) / param[p][2] * (dt * dt); // Mii-
            r[1] = (-(param[p][0] / dt - param[p][1] / (dt * dt) - val)) / param[p][2] * (dt * dt); // Mii+
        } else {
            r[0] = (-(param[p][0] / dt - param[p][1] / (dt * dt) - val))
                / param[p][2] * (dt * dt) * (((p % 3) === (1 % 2)) ? -1 : 1); //mod1
            r[1] = (-(param[p][0] / dt - param[p][1] / (dt * dt) - val))
                / param[p][2] * (dt * dt) * (((p % 3) === (2 % 2)) ? -1 : 1); //mod2
        }

    } else if (type === 3) {

        if (p >= 6)
            throw new Error("higher than M22 not available for Super-Growth");
        let a = 1.074, b = 0.467, c = 0.812;
        let calc = (extMod) => (val - a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt))) -
            ((p > 2) ? 0.059 * (p + 1) / dt : 0)) / betap[p][extMod] * (dt * dt);
        r[0] = calc(0); //Mii- or MOD1
        r[1] = calc(1);

    } else if (type === 4 || type === 5) {

        val += (type === 5) ? 0.02 : 0;
        if (p === 0) {
            r[0] = (val - 1 / (0.1270 + 0.8606 * dt)) / 0.04575 * (dt * dt); // MOD1
            r[1] = (val - 1 / (0.1270 + 0.8606 * dt)) / (-0.08802) * (dt * dt);
        } else if (p === 1) {
            r[0] = (val - 1 / (0.1174 + 0.4644 * dt)) / (-0.1829) * (dt * dt); //MOD1
            r[1] = (val - 1 / (0.1174 + 0.4644 * dt)) / 0.1705 * (dt * dt);
        } else throw new Error("only S11 and S22 are available for SDS-disp. or ssDNA disp.");

    } else throw new Error("invalid type");

    r[0] = r[0].toFixed(4); // 4位小数
    r[1] = r[0].toFixed(4);
    if (r[0] > 1 || r[0] < 0)
        r[0] = -1;
    if (r[1] > 1 || r[1] < 0)
        r[1] = -1;
    return r;

}

function getAverage(splitting, wRBM, pLesser, type) {

    // returns null-able average

    let dt = wRBM2Dt(wRBM, pLesser, type);

    if (isMetal(pLesser + 1)) throw new Error("p should be the smaller one");
    if (type <= 2) {
        if (pLesser >= 9)
            throw new Error("higher than S66 not available");

        if (isMetal(pLesser)) {

            let cos3Theta = dt * dt * splitting / 2 * param[pLesser][2];
            if (cos3Theta < 0 || cos3Theta > 1) return null;
            try {
                return (
                    getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, -1) +
                    getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, 0)
                ) / 2;
            } catch (err) {
                if (err.message === "dt")
                    return null;
                else throw err;
            }
        } else {
            let pLarger = pLesser + 1;
            let delta = (x) => param[pLarger][x] - param[pLesser][x];
            let mod = 1;
            let cos3Theta = (splitting * dt * dt - delta(0) * dt + delta(1)) / (
                param[pLarger][2] * (((pLarger % 3) === (mod % 2)) ? -1 : 1) -
                param[pLesser][2] * (((pLesser % 3) === (mod % 2)) ? -1 : 1)
            );
            if (cos3Theta < 0) {
                mod = 2;
                cos3Theta = -cos3Theta;
            }
            if (cos3Theta > 1) return null;
            try {
                return (
                    getEnergyFromCos3Theta(dt, cos3Theta, pLarger, type, mod) +
                    getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, mod)
                ) / 2;
            } catch (err) {
                if (err.message === "dt")
                    return null;
                else throw err;
            }
        }
    } else if (type === 3) {
        let a = 1.074, b = 0.467, c = 0.812;
        let sgE = (p) => a * (p + 1) / dt * (1 + b * Math.log10(c / ((p + 1) / dt))) +
            ((p > 2) ? 0.059 * (p + 1) / dt : 0);

        if (isMetal(pLesser)) {

            let cos3Theta = (splitting) * dt * dt / (betap[pLesser][1] - betap[pLesser][0]);
            if (cos3Theta < 0 || cos3Theta > 1)
                return null;
            return (
                getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, -1) +
                getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, 0)
            ) / 2;

        } else {

            let pLarger = pLesser + 1;
            let mod = 1;
            if (pLesser >= 6)
                throw new Error("higher than M22 not available for Super-Growth");
            let cos3Theta = (splitting + sgE(pLesser) - sgE(pLarger)) * dt * dt / (
                betap[pLarger][mod - 1] - betap[pLesser][mod - 1]
            );
            if (cos3Theta < 0 || cos3Theta > 1) {
                mod = 2;
                cos3Theta = (splitting + sgE(pLesser) - sgE(pLarger)) * dt * dt / (
                    betap[pLarger][mod - 1] - betap[pLesser][mod - 1]);
            }
            if (cos3Theta < 0 || cos3Theta > 1)
                return null;
            return (
                getEnergyFromCos3Theta(dt, cos3Theta, pLarger, type, mod) +
                getEnergyFromCos3Theta(dt, cos3Theta, pLesser, type, mod)
            ) / 2;
        }

    } else if (type === 4 || type === 5) {

        if (pLesser !== 0)
            throw new Error("only S11 and S22 are available for SDS-disp. or ssDNA disp.");
        let mod = 1;
        let cos3Theta = (splitting - (1 / (0.1174 + 0.4644 * dt) - 1 / (0.1270 + 0.8606 * dt)))
            * dt * dt / (-0.1829 - 0.04575);

        if (cos3Theta > 1 || cos3Theta < 0) {
            mod = 2;
            cos3Theta = (splitting - (1 / (0.1174 + 0.4644 * dt) - 1 / (0.1270 + 0.8606 * dt)))
                * dt * dt / (0.1705 - -0.08802);
        }
        if (cos3Theta > 1 || cos3Theta < 0)
            return null;

        return (
            getEnergyFromCos3Theta(dt, cos3Theta, 1, type, mod) +
            getEnergyFromCos3Theta(dt, cos3Theta, 0, type, mod)
        ) / 2;
    }
    else throw new Error("invalid type");
}

function getList(pLesser, type) {

    let li = [];
    const nMin = 5, nMax = 50, seriesThreshold = 90;

    if (!isMetal(pLesser))
    {
        if (isMetal(pLesser + 1)) throw new Error("p should be the smaller one, e.g. S11 rather than S22");
        for (let n = nMin; n < nMax; n++)
            for (let m = 0; m <= n; m++) {

            if (2 * n + m > seriesThreshold) break;
            try {
                if (!isMetal(n, m)) {
                    let dl = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, Mod(n, m));
                    let dh = getEnergy(Dt(n, m, type), Theta(n, m), pLesser + 1, type, Mod(n, m));
                    li.push([ n, m, (dh + dl) / 2, (dh - dl) ]);
                }
            } catch (err) {
                if (err.message !== "dt") throw err;
            }
        }
    } else {
        for (let n = nMin; n < nMax; n++)
            for (let m = 0; m <= n; m++) {

            if (2 * n + m > seriesThreshold) break;
            try {
                if (isMetal(n, m)) {
                    let dl = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, -1);
                    let dh = getEnergy(Dt(n, m, type), Theta(n, m), pLesser, type, 0);
                    li.push([ n, m, (dh + dl) / 2, (dh - dl) ]);
                }
            } catch (err) {
                if (err.message !== "dt") throw err;
            }
        }
    }
    return li;
}

function getRBMArray(pLesser, type) {

    let d = { rbmLabel: [], rbm: [] }; // return

    const cos3ThetaMax = 60;
    const wRBMMin = 70, wRBMMax = 350;
    if (!isMetal(pLesser) && isMetal(pLesser + 1))
        throw new Error("p should be the smaller one, e.g. S11 rather than S22");

    for (let rbm = wRBMMin; rbm <= wRBMMax; rbm += 10) {

        let dt = wRBM2Dt(rbm, pLesser, type);
        let t = [];
        try {
            if (isMetal(pLesser)) {
                let plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 0);
                let minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, -1);
                t.push([ (plus + minus) / 2, plus - minus ]);
                plus = getEnergyFromCos3Theta(dt, -cos3ThetaMax, pLesser, type, 0);
                minus = getEnergyFromCos3Theta(dt, -cos3ThetaMax, pLesser, type, -1);
                t.push([ (plus + minus) / 2, plus - minus ]);
                d.rbmLabel.push(rbm);
                d.rbm.push(t);
            } else {
                let plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser + 1, type, 1); //should it be higher?
                let minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 1);
                t.push([ (plus + minus) / 2, plus - minus ]);
                plus = getEnergyFromCos3Theta(dt, 0, pLesser + 1, type, 2);
                minus = getEnergyFromCos3Theta(dt, 0, pLesser, type, 2);
                t.push([ (plus + minus) / 2, plus - minus ]);
                plus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser + 1, type, 2);
                minus = getEnergyFromCos3Theta(dt, cos3ThetaMax, pLesser, type, 2);
                t.push([ (plus + minus) / 2, plus - minus ]);
                d.rbmLabel.push(rbm);
                d.rbm.push(t);
            }
        }
        catch (err)
        {
            if (err.message === "dt") break;
            else throw err;
        }
    }

    return d;
}