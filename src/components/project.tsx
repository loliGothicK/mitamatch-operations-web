import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import {
  SimpleTreeView,
  TreeItemContent,
  TreeItemIconContainer,
  TreeItemRoot,
  TreeItemGroupTransition,
  TreeItemIcon,
  TreeItemProvider,
  useTreeItem,
  type UseTreeItemParameters,
} from "@mui/x-tree-view";
import clsx from "clsx";
import {
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import {
  Folder,
  Groups as UnitIcon,
  Minimize,
  NearMe as OrderIcon,
} from "@mui/icons-material";
import {
  projectOpenAtom,
  openProjectListAtom,
  activeProjectAtom,
} from "@/jotai/projectAtoms";
import { useAtomDefault } from "@/jotai/default";

declare module "react" {
  interface CSSProperties {
    "--tree-view-color"?: string;
    "--tree-view-bg-color"?: string;
  }
}

interface StyledTreeItemProps
  extends Omit<UseTreeItemParameters, "rootRef">,
    HTMLAttributes<HTMLLIElement> {
  labelIcon: ElementType<SvgIconProps>;
  labelInfo?: string;
}

const CustomTreeItemRoot = styled(TreeItemRoot)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const CustomTreeItemContent = styled(TreeItemContent)(({ theme }) => ({
  marginBottom: theme.spacing(0.3),
  color: theme.palette.text.secondary,
  borderRadius: 4,
  fontWeight: theme.typography.fontWeightMedium,
  "&.expanded": {
    fontWeight: theme.typography.fontWeightRegular,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&.focused, &.selected, &.selected.focused": {
    backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
    color: "var(--tree-view-color)",
  },
}));

const CustomTreeItemIconContainer = styled(TreeItemIconContainer)(
  ({ theme }) => ({
    marginRight: theme.spacing(1),
  }),
);

const CustomTreeItemGroupTransition = styled(TreeItemGroupTransition)(
  ({ theme }) => ({
    marginLeft: 0,
    "& .content": {
      paddingLeft: theme.spacing(2),
    },
  }),
);

const CustomTreeItem = forwardRef(function CustomTreeItem(
  props: Omit<StyledTreeItemProps, "label" | "itemId"> & {
    label: string;
    itemId: number;
  },
  ref: Ref<HTMLLIElement>,
) {
  const theme = useTheme();
  const [, setOpenProjectList] = useAtomDefault(openProjectListAtom);
  const [, setValue] = useAtomDefault(activeProjectAtom);

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
  } = useTreeItem({
    id,
    itemId: `${itemId}`,
    children,
    label,
    disabled,
    rootRef: ref,
  });

  const style = {
    "--tree-view-color": theme.palette.action.active,
    "--tree-view-bg-color": theme.palette.action.selected,
  };

  return (
    <TreeItemProvider itemId={`${itemId}`} id={`${itemId}`}>
      <CustomTreeItemRoot
        {...getRootProps({ ...other, style })}
        onDoubleClick={() => {
          if (!children) {
            setValue(itemId);
            setOpenProjectList((prev) => {
              return new Map(prev.set(label, itemId));
            });
          }
        }}
      >
        <CustomTreeItemContent
          {...getContentProps({
            className: clsx("content", {
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
            <TreeItemIcon status={status} />
          </CustomTreeItemIconContainer>
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              alignItems: "center",
            }}
          >
            <Box component={LabelIcon} color="inherit" sx={{ mr: 1 }} />
            <Typography
              {...getLabelProps({
                variant: "caption",
                sx: { display: "flex", fontWeight: "inherit", flexGrow: 1 },
              })}
            />
          </Box>
        </CustomTreeItemContent>
        {children && (
          <CustomTreeItemGroupTransition {...getGroupTransitionProps()} />
        )}
      </CustomTreeItemRoot>
    </TreeItemProvider>
  );
});

export default function ProjectTreeView(props: { sx: { gridArea: string } }) {
  const [projectOpen, setProjectOpen] = useAtomDefault(projectOpenAtom);
  const theme = useTheme();
  return projectOpen ? (
    <Box
      sx={{
        ...props.sx,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack
        direction={"row"}
        display={"flex"}
        alignItems={"center"}
        sx={{ p: 2 }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Project
        </Typography>
        <Tooltip title={"Hide"}>
          <IconButton style={{ borderRadius: 4 }} size={"small"}>
            <Minimize
              sx={{ "&.MuiSvgIcon-root": { paddingBottom: "6px" } }}
              onClick={() => setProjectOpen(false)}
            />
          </IconButton>
        </Tooltip>
      </Stack>
      <SimpleTreeView
        defaultExpandedItems={["1"]}
        defaultSelectedItems="5"
        slots={{
          expandIcon: ArrowRightIcon,
          collapseIcon: ArrowDropDownIcon,
        }}
        sx={{ px: 3 }}
      >
        <CustomTreeItem itemId={1} label="Categories" labelIcon={Folder}>
          <CustomTreeItem itemId={2} label="Units" labelIcon={UnitIcon} />
          <CustomTreeItem itemId={3} label="Order" labelIcon={OrderIcon} />
        </CustomTreeItem>
      </SimpleTreeView>
    </Box>
  ) : (
    <Box sx={props.sx}> </Box>
  );
}
