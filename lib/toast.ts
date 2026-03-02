import { sileo } from "sileo";

// Brand fill colors — centralized here so every toast shares the same palette
const FILL = {
    loading: "#1d1d1d", // indigo-400
    success: "#1d1d1d", // emerald-500
    error: "#1d1d1d", // red-400
    warning: "#1d1d1d", // amber-400
    info: "#1d1d1d", // slate-400
} as const;

type Opts = Parameters<(typeof sileo)["success"]>[0];

function withFill(fill: string, opts: Opts): Opts {
    return { fill, ...opts };
}

export const toast = {
    success: (opts: Opts) => sileo.success(withFill(FILL.success, opts)),
    error: (opts: Opts) => sileo.error(withFill(FILL.error, opts)),
    warning: (opts: Opts) => sileo.warning(withFill(FILL.warning, opts)),
    info: (opts: Opts) => sileo.info(withFill(FILL.info, opts)),

    promise<T>(
        promise: Promise<T> | (() => Promise<T>),
        opts: {
            loading: Opts;
            success: Opts | ((data: T) => Opts);
            error: Opts | ((err: unknown) => Opts);
            position?: Parameters<(typeof sileo)["promise"]>[1]["position"];
        },
    ): Promise<T> {
        return sileo.promise(promise, {
            loading: withFill(FILL.loading, opts.loading),
            success:
                typeof opts.success === "function"
                    ? (data: T) =>
                          withFill(
                              FILL.success,
                              (opts.success as (d: T) => Opts)(data),
                          )
                    : withFill(FILL.success, opts.success as Opts),
            error:
                typeof opts.error === "function"
                    ? (err: unknown) =>
                          withFill(
                              FILL.error,
                              (opts.error as (e: unknown) => Opts)(err),
                          )
                    : withFill(FILL.error, opts.error as Opts),
            position: opts.position,
        });
    },

    dismiss: (id: string) => sileo.dismiss(id),
    clear: () => sileo.clear(),
};
