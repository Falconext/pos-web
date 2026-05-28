import React from 'react';
import { BRAND } from '@/lib/branding';
import FalconextLoginView from './FalconextLoginView';
import KrezkaLoginView from './KrezkaLoginView';
import WhiteLabelLoginView from './WhiteLabelLoginView';

export default function LoginView() {
    if (BRAND.isWhiteLabel) {
        return <WhiteLabelLoginView />;
    }

    if ((BRAND.authBrand || BRAND.name.toLowerCase()) === 'krezka') {
        return <KrezkaLoginView />;
    }

    return <FalconextLoginView />;
}
