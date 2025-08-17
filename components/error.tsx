
export function ErrorComponent({ error }: { error: string | null }) {
    return (
        <div className="py-2">
        {
            error ? (
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                <p className="text-red-500">{error}</p>
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
