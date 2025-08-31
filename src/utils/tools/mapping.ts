import { ApiInputSchema,} from "@/lib/ai-model-setting/commonModel";


// utils/mapping.ts

// apipoint rule
// support transform function
export type Transform =
    | { op: 'not' }                               // !v（ disable -> enable）
    | { op: 'enumMap'; map: Record<string, any>; default?: any } // enum map
    | { op: 'coalesce' }                          //  choose first non-empty  (如：data[key1] || data[key2] || data[key3])
    | { op: 'randomInt'; min?: number; max?: number } // generate random integer
    | { op: 'array' }                             // wrap in array
    | { op: 'toNumber' }                     // convert to number (optional)
    | { op: 'toString' }                     // convert to string (optional)
    | { op: 'pick'; index?: number }
    | { op: 'trim' }                              // string trim
    | { op: 'lowercase' }                         // lowercase
    | { op: 'uppercase' }                        // uppercase
    | { op: 'slice'; start?: number; end?: number }
    | { op: 'default'; value: any }
    | { op: 'customFn'; fn: (v: any) => any }
    | { op: 'customFn'; fn: string };

export type Condition =
    | { exists: string }                          // data[exists] exists and not empty
    | { equals: [string, any] }                   // data[key] === value
    | { not: Condition };                         // condition negation

export type MappingRule = {
    // target field (model API field, support dot path write)
    to: string;                                   // e.g. "image_size.width"

    // data source (optional)
    from?: string | string[];                     // from data key (string[] with coalesce)
    fromFile?: { name: string; index?: number; use?: 'file' | 'url' }; // from file (see supportAddFiles)

    // constant
    const?: any;

    // only write when condition is met
    when?: Condition;

    // transform chain (execute in order)
    transform?: Transform[];                      // 可选
};




// Split path into segments: supports escaped dots with \., [number], ["str"] / ['str']
function splitPath(path: string): string[] {
    // First convert ["..."] / ['...'] to .segments
    let p = path
        .replace(/\[(\d+)\]/g, '.$1') // Array index: a[0] -> a.0
        .replace(/\[["']([^"']+)["']\]/g, '.$1'); // Property name: a["b.c"] -> a.b.c (escaped dots will be restored later)

    // Handle escaped dots: temporarily replace \. with a placeholder
    const DOT_TOKEN = '__DOT__TOKEN__';
    p = p.replace(/\\\./g, DOT_TOKEN);

    // Split by dots
    const parts = p.split('.').filter(Boolean);

    // Restore the placeholder to real dots
    return parts.map(s => s.replace(new RegExp(DOT_TOKEN, 'g'), '.'));
}

// More robust getByPath:
// 1) First try exact key match (solves cases like data["meta_data.maxDuration"])
// 2) Then get value by path segments level by level
export function getByPath(src: any, path: string): any {
    if (!path || src == null) return undefined;

    // Exact key hit (flat object with dot in key name)
    if (Object.prototype.hasOwnProperty.call(src, path)) {
        return src[path];
    }

    const parts = splitPath(path);
    let cur = src;
    for (const k of parts) {
        if (cur == null) return undefined;
        cur = cur[k];
    }
    return cur;
}

// setByPath with support for \. escaped dots
export function setByPath(target: any, path: string, value: any) {
    const parts = splitPath(path);
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (obj[k] == null || typeof obj[k] !== 'object') obj[k] = {};
        obj = obj[k];
    }
    obj[parts[parts.length - 1]] = value;
}

// Other utilities remain unchanged, only refine the details of toNumber & default
function getFirstNonEmpty(values: any[]): any {
    for (const v of values) {
        if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')) return v;
    }
    return undefined;
}

function applyTransforms(value: any, transforms?: Transform[]): any {
    if (!transforms || !transforms.length) return value;
    let v = value;
    for (const t of transforms) {
        if (t.op === 'not') v = !v;
        else if (t.op === 'enumMap') v = (t.map as any)[String(v)] ?? t.default;
        else if (t.op === 'coalesce') v = Array.isArray(v) ? getFirstNonEmpty(v) : v;
        else if (t.op === 'randomInt') {
            const min = t.min ?? 1, max = t.max ?? 2147483647;
            v = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        else if (t.op === 'array') v = Array.isArray(v) ? v : (v === undefined ? [] : [v]);

        // ✅ Improvement: toNumber treats NaN as "empty" to allow default to take over
        else if (t.op === 'toNumber') {
            if (v === '' || v === undefined || v === null) {
                v = undefined;
            } else {
                const n = Number(v);
                v = Number.isNaN(n) ? undefined : n;
            }
        }

        else if (t.op === 'pick') {
            const idx = t.index ?? 0;
            v = Array.isArray(v) ? v[idx] : v;  // If not an array, return as is
        }
        else if (t.op === 'trim') v = (typeof v === 'string') ? v.trim() : v;
        else if (t.op === 'lowercase') v = (typeof v === 'string') ? v.toLowerCase() : v;
        else if (t.op === 'uppercase') v = (typeof v === 'string') ? v.toUpperCase() : v;
        else if (t.op === 'slice') {
            const start = t.start ?? 0;
            const end = t.end;
            v = Array.isArray(v) ? v.slice(start, end) : v;
          }
        else if (t.op === 'toString') v = String(v);
        else if (t.op === 'customFn') {
            try {
                if (typeof (t as any).fn === 'function') {
                    v = (t as any).fn(v);
                } else if (typeof (t as any).fn === 'string') {
                    const name = (t as any).fn as string;
                    switch (name) {
                        // add your customFn here
                        default:
                            console.warn(`Unknown customFn identifier: ${name}`);
                    }
                }
            } catch (err) {
                console.warn("customFn transform error:", err);
            }
        }
        else if (t.op === 'default') {
            const isEmpty =
                v === undefined ||
                v === null ||
                (typeof v === 'string' && v.trim() === '') ||
                (Array.isArray(v) && v.length === 0);
            if (isEmpty) v = t.value;
        }
    }
    return v;
}

function evalCondition(cond: Condition | undefined, data: any): boolean {
    if (!cond) return true;
    if ('not' in cond) return !evalCondition(cond.not, data);
    if ('exists' in cond) {
        const v = getByPath(data, cond.exists);
        return v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
    }
    if ('equals' in cond) {
        const [k, expected] = cond.equals;
        const v = getByPath(data, k);
        return v === expected;
    }
    return true;
}

export function buildApiInput(schema: ApiInputSchema, data: any) {

    const out: any = {};
    for (const rule of schema.rules) {
        if (!evalCondition(rule.when, data)) continue;

        let raw: any = undefined;
        if (rule.const !== undefined) {
            raw = rule.const;
        } else if (Array.isArray(rule.from)) {
            raw = rule.from.map((p) => getByPath(data, p));
        } else if (typeof rule.from === 'string') {
            raw = getByPath(data, rule.from);
        }

        const v = applyTransforms(raw, rule.transform);
        //   if (v !== undefined) setByPath(out, rule.to, v);

        // only ignore empty array , but keep string''
        if (v !== undefined && !(Array.isArray(v) && v.length === 0)) {
            setByPath(out, rule.to, v);
        }
        // this ignore all empty value, including string'', array[]
        // const isEmpty =
        //     v === undefined ||
        //     v === null ||
        //     (typeof v === 'string' && v.trim() === '') ||
        //     (Array.isArray(v) && v.length === 0);

        // if (!isEmpty) {
        //     setByPath(out, rule.to, v);
        // }


    }
    return out;
}
