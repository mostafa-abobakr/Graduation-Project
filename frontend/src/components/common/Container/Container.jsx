import { Box, useMediaQuery, useTheme } from '@mui/material'
import React from 'react'

const Container = ({ children, padding, backgroundColor, sx }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:450px)')
    return (
        <Box p={padding ? padding : isMobile ? 2 : 3} width={'100%'} sx={{
            backgroundColor: backgroundColor ? backgroundColor : theme.palette.background.default,
            ...sx,
        }}>
            {children}
        </Box>
    )
}

export default Container