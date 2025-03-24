import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Root,
  TreeItem2GroupTransition,
} from '@mui/x-tree-view/TreeItem2';
import {
  useTreeItem2,
  type UseTreeItem2Parameters,
} from '@mui/x-tree-view/useTreeItem2';
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider';
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon';
import clsx from 'clsx';
import {
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type Ref,
} from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import {
  Folder,
  Groups as UnitIcon,
  Minimize,
  NearMe as OrderIcon,
} from '@mui/icons-material';
import { projectOpenAtom } from '@/jotai/projectAtoms';
import { useAtom } from 'jotai';

declare module 'react' {
  interface CSSProperties {
    '--tree-view-color'?: string;
    '--tree-view-bg-color'?: string;
  }
}

interface StyledTreeItemProps
  extends Omit<UseTreeItem2Parameters, 'rootRef'>,
    HTMLAttributes<HTMLLIElement> {
  labelIcon: ElementType<SvgIconProps>;
  labelInfo?: string;
}

const CustomTreeItemRoot = styled(TreeItem2Root)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme }) => ({
  marginBottom: theme.spacing(0.3),
  color: theme.palette.text.secondary,
  borderRadius: 4,
  fontWeight: theme.typography.fontWeightMedium,
  '&.expanded': {
    fontWeight: theme.typography.fontWeightRegular,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.focused, &.selected, &.selected.focused': {
    backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
    color: 'var(--tree-view-color)',
  },
}));

const CustomTreeItemIconContainer = styled(TreeItem2IconContainer)(
  ({ theme }) => ({
    marginRight: theme.spacing(1),
  }),
);

const CustomTreeItemGroupTransition = styled(TreeItem2GroupTransition)(
  ({ theme }) => ({
    marginLeft: 0,
    '& .content': {
      paddingLeft: theme.spacing(2),
    },
  }),
);

const CustomTreeItem = forwardRef(function CustomTreeItem(
  props: StyledTreeItemProps,
  ref: Ref<HTMLLIElement>,
) {
  const theme = useTheme();
  const {
    id,
    itemId,
    label,
    disabled,
    children,
    labelIcon: LabelIcon,
    ...other
  } = props;

  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getLabelProps,
    getGroupTransitionProps,
    status,
  } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref });

  const style = {
    '--tree-view-color': theme.palette.action.active,
    '--tree-view-bg-color': theme.palette.action.selected,
  };

  return (
    <TreeItem2Provider itemId={itemId}>
      <CustomTreeItemRoot {...getRootProps({ ...other, style })}>
        <CustomTreeItemContent
          {...getContentProps({
            className: clsx('content', {
              expanded: status.expanded,
              selected: status.selected,
              focused: status.focused,
            }),
          })}
        >
          <CustomTreeItemIconContainer
            {...getIconContainerProps()}
            sx={{ borderRadius: 30 }}
          >
            <TreeItem2Icon status={status} />
          </CustomTreeItemIconContainer>
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              alignItems: 'center',
            }}
          >
            <Box component={LabelIcon} color='inherit' sx={{ mr: 1 }} />
            <Typography
              {...getLabelProps({
                variant: 'caption',
                sx: { display: 'flex', fontWeight: 'inherit', flexGrow: 1 },
              })}
            />
          </Box>
        </CustomTreeItemContent>
        {children && (
          <CustomTreeItemGroupTransition {...getGroupTransitionProps()} />
        )}
      </CustomTreeItemRoot>
    </TreeItem2Provider>
  );
});

export default function ProjectTreeView(props: { sx: { gridArea: string } }) {
  const [projectOpen, setProjectOpen] = useAtom(projectOpenAtom);
  const theme = useTheme();
  return projectOpen ? (
    <Box
      sx={{
        ...props.sx,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack
        direction={'row'}
        display={'flex'}
        alignItems={'center'}
        sx={{ p: 2 }}
      >
        <Typography variant='h6' sx={{ flexGrow: 1 }}>
          Project
        </Typography>
        <Tooltip title={'Hide'}>
          <IconButton style={{ borderRadius: 4 }} size={'small'}>
            <Minimize
              sx={{ '&.MuiSvgIcon-root': { paddingBottom: '6px' } }}
              onClick={() => setProjectOpen(false)}
            />
          </IconButton>
        </Tooltip>
      </Stack>
      <SimpleTreeView
        defaultExpandedItems={['3']}
        defaultSelectedItems='5'
        slots={{
          expandIcon: ArrowRightIcon,
          collapseIcon: ArrowDropDownIcon,
        }}
        sx={{ px: 3 }}
      >
        <CustomTreeItem itemId='3' label='Categories' labelIcon={Folder}>
          <CustomTreeItem itemId='5' label='Units' labelIcon={UnitIcon} />
          <CustomTreeItem itemId='6' label='Order' labelIcon={OrderIcon} />
        </CustomTreeItem>
      </SimpleTreeView>
    </Box>
  ) : (
    <Box sx={props.sx}> </Box>
  );
}
