import Box from '@mui/material/Box';
import { ReactElement, ReactNode } from 'react';

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index, ...other }: TabPanelProps): ReactElement => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`app-tabpanel-${index}`}
    aria-labelledby={`app-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
  </div>
);

export default TabPanel;
