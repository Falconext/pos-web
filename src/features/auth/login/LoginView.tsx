import React from 'react';
import { BRAND } from '@/lib/branding';
import FalconextLoginView from './FalconextLoginView';
import KrezkaLoginView from './KrezkaLoginView';

export default function LoginView() {
    // Determine which login view to show based on the active brand
    if ((BRAND.authBrand || BRAND.name.toLowerCase()) === 'krezka') {
        return <KrezkaLoginView />;
    }

    return <FalconextLoginView />;
}
