export class MapSet<V> {
    private mapping: { [key: string | number | symbol]: Set<V> } = {}
    constructor() { }
    public add(key: string | number | symbol, value: V) {
        const values = this.mapping[key] || new Set<V>();
        values.add(value);
        this.mapping[key] = values;
    }
    public get(key: string | number | symbol): Set<V> {
        return this.mapping[key];
    }
    public remove(key: string | number | symbol, value: V) {
        if (this.mapping[key]) {
            this.mapping[key].delete(value);
            if (this.mapping[key].size === 0) {
                delete this.mapping[key];
            }
        }
    }
    public removeKey(key: string | number | symbol) {
        delete this.mapping[key];
    }
}