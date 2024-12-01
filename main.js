import React, { StrictMode, useEffect, useRef, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
function fakeData() {
    const items = [];
    const minViewers = 7000;
    const maxViewers = 50000;
    for (let i = 0; i < 7; ++i) {
        const today = new Date();
        const date = today.setDate(today.getDate() - i);
        // put earliest items first
        items.unshift({
            date: new Date(date),
            viewers: Math.round(random() * (maxViewers - minViewers)) + minViewers
        });
    }
    return items;
}
function random() {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}
createRoot(document.getElementById("root")).render(React.createElement(StrictMode, null,
    React.createElement("main", null,
        React.createElement(IconSprites, null),
        React.createElement(ActivityCard, { data: fakeData() }))));
function ActivityCard({ data }) {
    // display viewers for the last 7 days
    const viewersOfWeek = data.slice(-7);
    const mostViewers = Math.max(...viewersOfWeek.map(item => item.viewers));
    // round max value to the next 10,000
    const viewersMax = Math.ceil(mostViewers / 1e4) * 1e4;
    let [groupA, groupB] = viewersOfWeek.slice(-2).reverse();
    if (!groupA)
        groupA = { viewers: 0 };
    if (!groupB)
        groupB = { viewers: 0 };
    const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
        month: "2-digit",
        day: "numeric"
    });
    return (React.createElement("div", { className: "activity" },
        React.createElement("div", { className: "activity__container" },
            React.createElement(ActivityCardHeader, { title: "Profile activity" }),
            React.createElement("div", { className: "activity__body" },
                React.createElement(ActivityCardBarSummary, { groupA: groupA.viewers, groupB: groupB.viewers }),
                React.createElement("div", { className: "activity__graph" }, viewersOfWeek.length ? viewersOfWeek.map((item, i) => {
                    const { date, viewers } = item;
                    const shortDate = shortDateFormat.format(date);
                    return (React.createElement(ActivityCardBarGraph, { key: i, value: Math.min(viewers, viewersMax), max: viewersMax, label: shortDate }));
                }) : React.createElement("div", { className: "activity__graph-empty" },
                    React.createElement("em", null, "No data")))))));
}
function ActivityCardBarGraph({ value, max, label }) {
    const [animated, setAnimated] = useState(false);
    const animationRef = useRef(0);
    const fraction = value / max;
    const fractionInvert = 1 - fraction;
    // percents should be in ascending order
    const firstLevel = { hue: 3, percent: 0 };
    const levelMap = [
        firstLevel,
        { hue: 33, percent: 0.2 },
        { hue: 253, percent: 0.4 },
        { hue: 223, percent: 0.6 },
        { hue: 193, percent: 0.8 }
    ];
    const level = levelMap.reverse().find(item => fraction > item.percent) || firstLevel;
    const { hue } = level;
    // knob positioning
    const knobWidth = 0.75;
    const knobStyle = { backgroundColor: `hsl(${hue},90%,90%)` };
    const translateStart = `translateY(calc(100% - ${knobWidth}em))`;
    const translateEnd = `translateY(calc(${fractionInvert * 100}% - ${fractionInvert * knobWidth}em))`;
    const knobTrackStyle = { transform: animated ? translateEnd : translateStart };
    // tooltip
    const valueFormatted = new Intl.NumberFormat(LOCALE).format(value);
    const tipHash = Math.round(random() * 0xffff).toString(16);
    useEffect(() => {
        // allow the animation to run on mount
        animationRef.current = setTimeout(() => setAnimated(true), 0);
    }, []);
    return (React.createElement("div", { className: "activity__graph-bar" },
        React.createElement("div", { className: "activity__graph-bar-outer" },
            React.createElement("div", { className: "activity__graph-bar-inner" },
                React.createElement("svg", { className: "activity__graph-bar-svg", viewBox: "0 0 2 24", width: "2px", height: "24px", role: "img", "aria-label": `Bar filled at ${(fraction * 100).toFixed(1)}%`, style: knobTrackStyle },
                    React.createElement("defs", null,
                        React.createElement("linearGradient", { id: `bar-fill-${hue}`, x1: "0", y1: "0", x2: "0", y2: "1" },
                            React.createElement("stop", { offset: "0", stopColor: `hsl(${hue},90%,50%)` }),
                            React.createElement("stop", { offset: "1", stopColor: `hsl(${hue},90%,70%)` }))),
                    React.createElement("g", { strokeLinecap: "round", strokeWidth: "2" },
                        React.createElement("line", { x1: "1", y1: "1", x2: "1", y2: "23" }),
                        React.createElement("line", { x1: "1.0001", y1: "1", x2: "1", y2: "23", stroke: `url(#bar-fill-${hue})` }))),
                React.createElement("div", { className: "activity__graph-bar-knob-track", style: knobTrackStyle },
                    React.createElement("button", { type: "button", className: "activity__graph-bar-knob", "aria-labelledby": `tip-${tipHash} tip-${tipHash}-label`, style: knobStyle }))),
            React.createElement("div", { className: "activity__tip-wrapper", style: knobTrackStyle },
                React.createElement("div", { id: `tip-${tipHash}`, className: "activity__tip" },
                    React.createElement("small", null, valueFormatted)))),
        React.createElement("small", { id: `tip-${tipHash}-label`, className: "activity__graph-label" }, label)));
}
function ActivityCardHeader({ title }) {
    return (React.createElement("div", { className: "activity__header" },
        React.createElement("span", null, title),
        React.createElement("button", { className: "activity__button", type: "button", "aria-label": "More" },
            React.createElement(Icon, { icon: "more" }))));
}
function ActivityCardBarSummary({ groupA, groupB }) {
    let change = groupA / groupB - 1;
    if (change === Infinity)
        change = 1;
    else if (isNaN(change))
        change = 0;
    const groupAFormatted = Intl.NumberFormat(LOCALE, {
        notation: "compact"
    }).format(groupA);
    const changeIsLess = groupA < groupB;
    const noChange = groupA === groupB;
    const changeFormatted = Intl.NumberFormat(LOCALE, {
        maximumFractionDigits: 1,
        style: "percent"
    }).format(Math.abs(change));
    const arrowDirection = changeIsLess ? "down-right" : (noChange ? "right" : "up-right");
    const iconColor = changeIsLess ? "danger" : (noChange ? "neutral" : "success");
    return (React.createElement("div", { className: "activity__summary" },
        React.createElement("div", { className: "activity__summary-start" },
            React.createElement("span", { className: "activity__value" }, groupAFormatted),
            React.createElement("br", null),
            React.createElement("span", null, "People watched your videos today")),
        React.createElement("div", { className: "activity__summary-end" },
            React.createElement("strong", { className: "activity__change" },
                changeFormatted,
                React.createElement(Icon, { icon: `arrow-${arrowDirection}`, color: iconColor })),
            React.createElement("small", null, "vs last day"))));
}
function Icon({ icon, color }) {
    const colorClass = color ? ` icon--${color}` : "";
    return (React.createElement("svg", { className: `icon${colorClass}`, width: "16px", height: "16px", "aria-hidden": "true" },
        React.createElement("use", { href: `#${icon}` })));
}
function IconSprites() {
    return (React.createElement("svg", { width: "0", height: "0", "aria-hidden": "true" },
        React.createElement("symbol", { id: "arrow-up-right", viewBox: "0 0 21 21" },
            React.createElement("path", { fill: "currentcolor", fillRule: "evenodd", clipRule: "evenodd", d: "M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14V11.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L12.5858 10H10C9.44772 10 9 9.55228 9 9C9 8.44772 9.44772 8 10 8H14.6717C15.4054 8 16 8.59489 16 9.32837V14Z", transform: "translate(-1.5,-1.5)" })),
        React.createElement("symbol", { id: "arrow-right", viewBox: "0 0 21 21" },
            React.createElement("path", { fill: "currentcolor", fillRule: "evenodd", clipRule: "evenodd", d: "M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14V11.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L12.5858 10H10C9.44772 10 9 9.55228 9 9C9 8.44772 9.44772 8 10 8H14.6717C15.4054 8 16 8.59489 16 9.32837V14Z", transform: "rotate(45,10.5,10.5) translate(-1.5,-1.5)" })),
        React.createElement("symbol", { id: "arrow-down-right", viewBox: "0 0 21 21" },
            React.createElement("path", { fill: "currentcolor", fillRule: "evenodd", clipRule: "evenodd", d: "M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM16 14C16 14.5523 15.5523 15 15 15C14.4477 15 14 14.5523 14 14V11.4142L9.70711 15.7071C9.31658 16.0976 8.68342 16.0976 8.29289 15.7071C7.90237 15.3166 7.90237 14.6834 8.29289 14.2929L12.5858 10H10C9.44772 10 9 9.55228 9 9C9 8.44772 9.44772 8 10 8H14.6717C15.4054 8 16 8.59489 16 9.32837V14Z", transform: "rotate(90,10.5,10.5) translate(-1.5,-1.5)" })),
        React.createElement("symbol", { id: "more", viewBox: "0 0 24 24" },
            React.createElement("g", { fill: "currentcolor" },
                React.createElement("circle", { cx: "3", cy: "12", r: "1.5" }),
                React.createElement("circle", { cx: "12", cy: "12", r: "1.5" }),
                React.createElement("circle", { cx: "21", cy: "12", r: "1.5" })))));
}
const LOCALE = "en-US";
