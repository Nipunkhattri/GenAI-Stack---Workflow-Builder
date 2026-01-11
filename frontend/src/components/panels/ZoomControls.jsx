import { useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Minus, Maximize2, ChevronDown } from 'lucide-react';

const zoomLevels = [25, 50, 75, 100, 125, 150, 200];

function ZoomControls() {
    const { zoomIn, zoomOut, fitView, getZoom, setViewport, getViewport } = useReactFlow();
    const [zoom, setZoom] = useState(100);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateZoomDisplay = () => {
        const currentZoom = getZoom();
        setZoom(Math.round(currentZoom * 100));
    };

    const handleZoomIn = () => {
        zoomIn();
        setTimeout(updateZoomDisplay, 50);
    };

    const handleZoomOut = () => {
        zoomOut();
        setTimeout(updateZoomDisplay, 50);
    };

    const handleFitView = () => {
        fitView({ padding: 0.2 });
        setTimeout(updateZoomDisplay, 50);
    };

    const handleSetZoom = (level) => {
        const { x, y } = getViewport();
        setViewport({ x, y, zoom: level / 100 });
        setZoom(level);
        setShowDropdown(false);
    };

    useEffect(() => {
        const interval = setInterval(updateZoomDisplay, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center bg-white rounded-xl shadow-lg z-10">
            <button
                onClick={handleZoomIn}
                className="flex items-center justify-center w-12 h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-l-xl"
            >
                <Plus size={20} strokeWidth={2} />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <button
                onClick={handleZoomOut}
                className="flex items-center justify-center w-12 h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
                <Minus size={20} strokeWidth={2} />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <button
                onClick={handleFitView}
                className="flex items-center justify-center w-12 h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
                <Maximize2 size={18} strokeWidth={2} />
            </button>

            <div className="w-px h-6 bg-gray-200" />

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center justify-center gap-1 px-4 h-12 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors rounded-r-xl font-medium text-sm"
                >
                    <span>{zoom}%</span>
                    <ChevronDown size={16} strokeWidth={2} />
                </button>

                {showDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[80px]">
                        {zoomLevels.map((level) => (
                            <button
                                key={level}
                                onClick={() => handleSetZoom(level)}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${zoom === level ? 'text-green-600 font-medium' : 'text-gray-700'
                                    }`}
                            >
                                {level}%
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ZoomControls;
