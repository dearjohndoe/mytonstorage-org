
import {
  Clock,
  MapPin,
} from "lucide-react"
import type { Provider } from "@/types/provider"


export function ProviderDetails({ provider }: { provider: Provider }) {
    return (
        <tr key={`${provider.id}-details`}>
            <td colSpan={7} className="bg-gray-50 p-0">
            <div className="p-4 text-sm">
                <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-semibold">Uptime:</span>
                    <span className="ml-2">{provider.uptime}</span>
                </div>
                <div className="flex items-center mb-2">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-semibold">Location:</span>
                    <span className="ml-2">{provider.location}</span>
                </div>
            </div>
            </td>
        </tr>
    )
}
