
import type React from "react"

export function ErrorComponent({ error }: { error: string | React.ReactNode | null }) {
    return (
        <div className="py-2">
        {
            error ? (
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <div className="text-red-500">{error}</div>
            </div>
            ) : (
            <div className="flex flex-col items-center p-4 rounded-lg">
                <p><wbr></wbr></p>
            </div>
            )
        }
        </div>
    );
}
