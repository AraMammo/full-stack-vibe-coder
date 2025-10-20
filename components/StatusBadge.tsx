/**
 * Status Badge Component
 *
 * Displays workflow or proposal status with appropriate styling
 */

interface StatusBadgeProps {
  status: string;
  type?: 'workflow' | 'proposal' | 'project';
}

export function StatusBadge({ status, type = 'workflow' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase();

    // Workflow statuses
    if (type === 'workflow') {
      switch (normalizedStatus) {
        case 'pending':
          return { label: 'Queued', color: 'bg-gray-100 text-gray-700 border-gray-300' };
        case 'in_progress':
          return { label: 'Processing', color: 'bg-blue-100 text-blue-700 border-blue-300' };
        case 'completed':
          return { label: 'Complete', color: 'bg-green-100 text-green-700 border-green-300' };
        case 'failed':
          return { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-300' };
        default:
          return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
    }

    // Proposal statuses
    if (type === 'proposal') {
      switch (normalizedStatus) {
        case 'draft':
          return { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300' };
        case 'pending_review':
          return { label: 'Ready for Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
        case 'approved':
          return { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-300' };
        case 'revision_requested':
          return { label: 'Revision Requested', color: 'bg-orange-100 text-orange-700 border-orange-300' };
        case 'rejected':
          return { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-300' };
        default:
          return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
    }

    // Project statuses
    if (type === 'project') {
      switch (normalizedStatus) {
        case 'not_started':
          return { label: 'Not Started', color: 'bg-gray-100 text-gray-700 border-gray-300' };
        case 'in_progress':
          return { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-300' };
        case 'review':
          return { label: 'Under Review', color: 'bg-purple-100 text-purple-700 border-purple-300' };
        case 'completed':
          return { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-300' };
        case 'delivered':
          return { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-300' };
        default:
          return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
    }

    return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
