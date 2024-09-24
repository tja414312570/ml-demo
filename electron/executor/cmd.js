// modules/module1.js
export const support = 'cmd';
export function decode(data) {
    return `Decoded by ${support}: ${data}`;
}