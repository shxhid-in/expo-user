// Theme colors extracted from DESIGN_SYSTEM.md
export const Colors = {
    brand: {
        primary: '#008080',
        primarySoft: 'rgba(0, 128, 128, 0.1)',
        primaryDark: '#006666',
        tealLight: '#20b2aa',
    },
    light: {
        background: '#FFFFFF',
        backgroundSecondary: '#F9FAFB',
        text: '#000000',
        textMuted: '#6B7280',
        border: '#E5E7EB',
        card: '#FFFFFF',
        input: '#FFFFFF',
        borderLight: '#F1F5F9',
    },
    dark: {
        background: '#0F172A',
        backgroundSecondary: '#020617',
        text: '#F1F5F9',
        textMuted: '#94A3B8',
        border: '#1E293B',
        card: '#1E293B',
        input: '#0F172A',
        borderLight: '#334155',
    },
    status: {
        success: '#22c55e',
        successDark: '#16a34a',
        successBg: '#f0fdf4',
        error: '#EF4444',
        errorBg: '#FEF2F2',
        amber: '#F59E0B',
        starDefault: '#D1D5DB',
    },
    neutral: {
        disabled: '#E5E7EB',
        disabledText: '#9CA3AF',
        white: '#FFFFFF',
        black: '#000000',
        desktopBg: '#f8fafc',
        upiPageBg: '#fdfdfd',
        tealSoftBg: '#f0fdfa',
        tealVeryLight: '#F0FDFD',
    },
};

export const Gradients = {
    ctaButton: ['#008080', '#006666'] as const,
    locationIcon: ['#008080', '#20b2aa'] as const,
    successIcon: ['#22c55e', '#16a34a'] as const,
    characterBg: ['#f0fdfa', '#ffffff'] as const,
    splashVignette: ['transparent', 'rgba(0,0,0,0.15)'] as const,
};

export const Typography = {
    fontFamily: {
        heading: 'Outfit_700Bold',
        headingBold: 'Outfit_800ExtraBold',
        body: 'Inter_400Regular',
        bodyMedium: 'Inter_500Medium',
        bodySemiBold: 'Inter_600SemiBold',
        bodyBold: 'Inter_700Bold',
    },
    fontSize: {
        xs: 11,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 40,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
};

export const BorderRadius = {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14,
    '2xl': 16,
    '3xl': 18,
    '4xl': 20,
    '5xl': 24,
    full: 100,
};

export const Shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHover: {
        shadowColor: '#008080',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 4,
    },
    button: {
        shadowColor: '#008080',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
        elevation: 8,
    },
    header: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 30,
        elevation: 2,
    },
    input: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    social: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
} as const;
