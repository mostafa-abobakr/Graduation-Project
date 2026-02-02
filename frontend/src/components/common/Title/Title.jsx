import { Typography, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'

const Title = ({ title, fontSize, color, fontWeight, sx, children }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:450px)');
    return (
        <Typography sx={{
            fontSize: fontSize ? fontSize : isMobile ? '18px' : '22px',
            color: color ? color : theme.palette.text.Darktext,
            fontWeight: fontWeight ? fontWeight : 500,
            ...sx,
        }}>
            {title || children}
        </Typography>
    )
}

export default Title