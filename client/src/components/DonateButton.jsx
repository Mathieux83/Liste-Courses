import { useNavigate, useLocation } from "react-router-dom";
import { GiftIcon } from "@heroicons/react/24/solid";

export function DonateButton() {
    const navigate = useNavigate()
    const location = useLocation()

    const goDonate = () => {
        navigate('/donations')
    }

    return (
        <button
            onClick={goDonate}
            className="btn-primary"
            title="Soutenez-nous"
            style={{ fontSize: 'x-large'}}
        >
            Soutenez-nous
            <GiftIcon className="inline h-7 w-7 ml-1.5 mb-1"/>
        </button>
    )
}

