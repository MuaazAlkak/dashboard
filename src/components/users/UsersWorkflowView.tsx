import { useEffect, useState, useCallback } from 'react';
import { AdminUser } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Shield, 
  Edit, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Info,
  UserCog,
  Trash2,
  Plus,
  Minus,
  User,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UsersWorkflowViewProps {
  users: AdminUser[];
  onViewDetails?: (user: AdminUser) => void;
  onEditRole?: (user: AdminUser) => void;
  onDeleteUser?: (user: AdminUser) => void;
  currentUserId?: string;
  isSuperAdmin?: boolean;
}

interface WorkflowNode {
  id: string;
  type: 'role' | 'user';
  position: { x: number; y: number };
  data: {
    label: string;
    role?: string;
    user?: AdminUser;
    color: string;
    icon: LucideIcon;
  };
  selected: boolean;
  dragging: boolean;
}

interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle: 'right';
  targetHandle: 'left';
}

const roleConfig = {
  super_admin: {
    icon: ShieldCheck,
    color: '#9333ea',
    bgColor: '#f3e8ff',
    label: 'Super Admin',
  },
  admin: {
    icon: Shield,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    label: 'Admin',
  },
  editor: {
    icon: Edit,
    color: '#10b981',
    bgColor: '#d1fae5',
    label: 'Editor',
  },
  viewer: {
    icon: Eye,
    color: '#6b7280',
    bgColor: '#f3f4f6',
    label: 'Viewer',
  },
};

export function UsersWorkflowView({
  users,
  onViewDetails,
  onEditRole,
  onDeleteUser,
  currentUserId,
  isSuperAdmin,
}: UsersWorkflowViewProps) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Initialize nodes and connections
  useEffect(() => {
    const roleNodes: WorkflowNode[] = [];
    const userNodes: WorkflowNode[] = [];
    const conns: Connection[] = [];

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = [];
      acc[user.role].push(user);
      return acc;
    }, {} as Record<string, AdminUser[]>);

    const roles = Object.keys(usersByRole) as Array<keyof typeof roleConfig>;
    
    // Create role nodes vertically spaced
    roles.forEach((role, index) => {
      const roleNode: WorkflowNode = {
        id: `role-${role}`,
        type: 'role',
        position: { x: 100, y: 100 + index * 200 },
        data: {
          label: roleConfig[role].label,
          role,
          color: roleConfig[role].color,
          icon: roleConfig[role].icon,
        },
        selected: false,
        dragging: false,
      };
      roleNodes.push(roleNode);

      // Create user nodes to the right of their role
      const roleUsers = usersByRole[role];
      roleUsers.forEach((user, userIndex) => {
        const userNode: WorkflowNode = {
          id: user.id,
          type: 'user',
          position: { 
            x: 400 + (userIndex % 3) * 220, 
            y: 100 + index * 200 + Math.floor(userIndex / 3) * 120 
          },
          data: {
            label: user.email,
            role,
            user,
            color: roleConfig[role as keyof typeof roleConfig].color,
            icon: User,
          },
          selected: false,
          dragging: false,
        };
        userNodes.push(userNode);

        // Create connection
        conns.push({
          id: `${roleNode.id}-${userNode.id}`,
          source: roleNode.id,
          target: userNode.id,
          sourceHandle: 'right',
          targetHandle: 'left',
        });
      });
    });

    setNodes([...roleNodes, ...userNodes]);
    setConnections(conns);
  }, [users]);

  // Mouse handlers for panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-node]')) {
      return; // Let node handle it
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && !draggedNode) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggedNode) {
      const node = nodes.find(n => n.id === draggedNode);
      if (node) {
        const newX = (e.clientX - pan.x) / zoom - dragStart.x;
        const newY = (e.clientY - pan.y) / zoom - dragStart.y;
        
        setNodes(prevNodes =>
          prevNodes.map(n =>
            n.id === draggedNode
              ? { ...n, position: { x: newX, y: newY } }
              : n
          )
        );
      }
    }
  }, [isPanning, draggedNode, panStart, pan, zoom, dragStart, nodes]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (draggedNode) {
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === draggedNode ? { ...node, dragging: false } : node
        )
      );
      setDraggedNode(null);
    }
  }, [draggedNode]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    setDragStart({
      x: (e.clientX - pan.x) / zoom - node.position.x,
      y: (e.clientY - pan.y) / zoom - node.position.y,
    });
    
    setNodes(prevNodes =>
      prevNodes.map(n =>
        n.id === nodeId ? { ...n, dragging: true, selected: true } : { ...n, selected: false }
      )
    );
    setSelectedNode(nodeId);
  }, [nodes, pan, zoom]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    setNodes(prevNodes =>
      prevNodes.map(n => ({ ...n, selected: n.id === nodeId }))
    );
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate connection path (Bezier curve like N8N)
  const getConnectionPath = (source: WorkflowNode, target: WorkflowNode) => {
    const sourceX = source.position.x + 200; // Right side of source
    const sourceY = source.position.y + 45; // Middle of node
    const targetX = target.position.x; // Left side of target
    const targetY = target.position.y + 45; // Middle of node

    const distance = Math.abs(targetX - sourceX);
    const controlPointOffset = Math.min(distance * 0.5, 100);

    return `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY}, ${targetX - controlPointOffset} ${targetY}, ${targetX} ${targetY}`;
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-1 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="px-2 py-1 text-xs font-medium text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="h-px bg-border my-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="h-8 w-8 p-0"
            title="Reset View"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3 max-w-[200px]">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          User Roles
        </h4>
        <div className="space-y-2">
          {Object.entries(roleConfig).map(([key, config]) => {
            const Icon = config.icon;
            const count = users.filter(u => u.role === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: config.color }}
                />
                <Icon className="h-3 w-3" />
                <span className="flex-1">{config.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <span className="text-base">🎯</span> Drag nodes to move
          </p>
          <p className="flex items-center gap-1">
            <span className="text-base">✋</span> Drag canvas to pan
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="w-full h-[calc(100vh-350px)] min-h-[600px] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isPanning ? 'grabbing' : draggedNode ? 'grabbing' : 'grab',
        }}
      >
        {/* SVG for connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>
          {connections.map(conn => {
            const sourceNode = nodes.find(n => n.id === conn.source);
            const targetNode = nodes.find(n => n.id === conn.target);
            if (!sourceNode || !targetNode) return null;

            const path = getConnectionPath(sourceNode, targetNode);
            const isConnected = selectedNode === conn.source || selectedNode === conn.target;

            return (
              <g key={conn.id} transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                <path
                  d={path}
                  stroke={isConnected ? sourceNode.data.color : '#cbd5e1'}
                  strokeWidth={isConnected ? 3 : 2}
                  fill="none"
                  className="transition-all duration-200"
                  markerEnd={isConnected ? "url(#arrowhead)" : undefined}
                />
                {/* Connection hover area */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth={20}
                  fill="none"
                  className="pointer-events-auto cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map(node => {
            const Icon = node.data.icon;
            const isSelected = node.selected;
            const isHovered = hoveredNode === node.id;
            const isCurrentUser = node.type === 'user' && node.data.user?.id === currentUserId;

            return (
              <div
                key={node.id}
                data-node
                className={`absolute pointer-events-auto ${
                  node.dragging ? 'transition-none' : 'transition-all duration-200'
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: isHovered && !node.dragging ? 'scale(1.02)' : 'scale(1)',
                  cursor: node.dragging ? 'grabbing' : 'grab',
                  zIndex: node.dragging ? 1000 : isSelected ? 100 : 10,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  if (!node.dragging) {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }
                }}
                onMouseEnter={() => !node.dragging && setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* N8N Style Node */}
                <div
                  className={`
                    relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 
                    ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                    ${node.type === 'role' ? 'w-[200px]' : 'w-[200px]'}
                    ${node.dragging ? '' : 'transition-all duration-200'}
                  `}
                  style={{
                    borderColor: isSelected ? node.data.color : '#e5e7eb',
                    boxShadow: node.dragging 
                      ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                      : undefined,
                  }}
                >
                  {/* Node Header */}
                  <div
                    className="px-4 py-3 rounded-t-lg flex items-center gap-3"
                    style={{
                      backgroundColor: node.type === 'role' 
                        ? node.data.color 
                        : roleConfig[node.data.role as keyof typeof roleConfig]?.bgColor || '#f3f4f6',
                    }}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        node.type === 'role' ? 'bg-white/20' : 'bg-white'
                      }`}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{
                          color: node.type === 'role' ? '#ffffff' : node.data.color,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          node.type === 'role' ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {node.type === 'role' ? node.data.label : node.data.user?.email.split('@')[0]}
                      </div>
                      {node.type === 'user' && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {node.data.user?.email.split('@')[1]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Node Body */}
                  <div className="px-4 py-3 space-y-2">
                    {node.type === 'role' ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Users:</span>
                          <Badge variant="secondary">
                            {users.filter(u => u.role === node.data.role).length}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Role:</span>
                          <Badge 
                            variant="outline" 
                            className="text-[10px]"
                            style={{ 
                              borderColor: node.data.color,
                              color: node.data.color 
                            }}
                          >
                            {roleConfig[node.data.role as keyof typeof roleConfig]?.label}
                          </Badge>
                        </div>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] w-full justify-center">
                            ⭐ You
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Menu - Only for users */}
                  {node.type === 'user' && node.data.user && (
                    <div className="px-2 pb-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs"
                          >
                            Actions
                            <ChevronRight className="h-3 w-3 ml-auto" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails?.(node.data.user!)}>
                            <Info className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {isSuperAdmin && node.data.user.id !== currentUserId && (
                            <>
                              <DropdownMenuItem onClick={() => onEditRole?.(node.data.user!)}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDeleteUser?.(node.data.user!)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Connection Handles */}
                  {node.type === 'role' && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full border-2 border-white bg-gray-400"
                      style={{ backgroundColor: node.data.color }}
                    />
                  )}
                  {node.type === 'user' && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white bg-gray-400"
                      style={{ backgroundColor: node.data.color }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border px-4 py-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{users.length} Users</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span>{nodes.filter(n => n.type === 'role').length} Roles</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span>{connections.length} Connections</span>
        </div>
      </div>
    </div>
  );
}

