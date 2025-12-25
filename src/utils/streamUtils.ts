import { Stream } from '../services/api';

export const getStreamStatus = (stream: Stream): { label: string; color: string; bgColor: string } => {
    if (!stream) {
        return { label: 'SCHEDULED', color: '#FFFFFF', bgColor: '#6B7280' };
    }

    const tpStatus = stream.tpStatus?.toUpperCase();
    const status = stream.status?.toLowerCase();

    // Check for DISCONNECTED status first (it's a specific TPStreams status)
    if (tpStatus === 'DISCONNECTED') {
        // If disconnected but was streaming, it might be temporarily offline
        // Check if there's an actualStartTime to determine if it was live
        if (stream.actualStartTime) {
            return { label: 'LIVE', color: '#FFFFFF', bgColor: '#EF4444' };
        }
        return { label: 'UPCOMING', color: '#FFFFFF', bgColor: '#3B82F6' };
    }

    if (tpStatus === 'STREAMING' || tpStatus === 'STARTED' || status === 'live' || stream.isServerStarted) {
        return { label: 'LIVE', color: '#FFFFFF', bgColor: '#EF4444' };
    }
    if (tpStatus === 'NOT_STARTED' || status === 'scheduled' || status === 'upcoming') {
        return { label: 'UPCOMING', color: '#FFFFFF', bgColor: '#3B82F6' };
    }
    if (tpStatus === 'COMPLETED' || tpStatus === 'STOPPED' || status === 'completed' || status === 'ended') {
        return { label: 'RECORDED', color: '#FFFFFF', bgColor: '#10B981' };
    }
    return { label: 'SCHEDULED', color: '#FFFFFF', bgColor: '#6B7280' };
};

export const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Date TBD';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Date TBD';
        
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === -1) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays > 0 && diffDays <= 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    } catch {
        return 'Date TBD';
    }
};

export const getCountdown = (startTime?: string): string => {
    if (!startTime) return '';
    try {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) return '';
        
        const now = new Date();
        const diff = start.getTime() - now.getTime();
       
        if (diff <= 0) return '';
       
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
       
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    } catch {
        return '';
    }
};

