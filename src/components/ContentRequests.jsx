import { useState, useMemo, useEffect } from 'react';
import { Plus, Calendar, User, CheckCircle, Clock, XCircle, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import ContentRequestModal from './ContentRequestModal';
import { INITIAL_REQUESTS } from '../data/initialRequests';

const ContentRequests = ({ creators }) => {
  const [requests, setRequests] = useState(() => {
    const stored = localStorage.getItem('requests');
    if (stored) {
      try {
        const parsedRequests = JSON.parse(stored);
        // Migrate old format (single creator) to new format (multiple creators)
        return parsedRequests.map(req => {
          if (req.creatorId && !req.creators) {
            return {
              ...req,
              creators: [{
                id: req.creatorId,
                name: req.creatorName
              }]
            };
          }
          return req;
        });
      } catch (e) {
        console.error('Failed to parse requests from localStorage:', e);
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCreatorId, setFilterCreatorId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [editRequestForm, setEditRequestForm] = useState({
    title: '',
    description: '',
    selectedCreatorIds: [],
    dueDate: '',
    status: 'pending'
  });

  // Save requests to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('requests', JSON.stringify(requests));
  }, [requests]);

  const startEditRequest = (request) => {
    setEditingRequestId(request.id);
    setEditRequestForm({
      title: request.title,
      description: request.description,
      selectedCreatorIds: (request.creators || []).map(c => c.id),
      dueDate: new Date(request.dueDate).toISOString().slice(0, 10),
      status: request.status
    });
  };

  const saveEditRequest = () => {
    if (!editRequestForm.title.trim()) {
      alert('Title is required');
      return;
    }

    if (editRequestForm.selectedCreatorIds.length === 0) {
      alert('At least one creator is required');
      return;
    }

    const selectedCreators = creators.filter(c => editRequestForm.selectedCreatorIds.includes(c.id));

    setRequests(requests.map(req =>
      req.id === editingRequestId
        ? {
            ...req,
            title: editRequestForm.title,
            description: editRequestForm.description,
            creators: selectedCreators.map(c => ({ id: c.id, name: c.name })),
            dueDate: new Date(editRequestForm.dueDate).toISOString(),
            status: editRequestForm.status
          }
        : req
    ));
    setEditingRequestId(null);
  };

  const cancelEditRequest = () => {
    setEditingRequestId(null);
    setEditRequestForm({
      title: '',
      description: '',
      selectedCreatorIds: [],
      dueDate: '',
      status: 'pending'
    });
  };

  const deleteRequest = (requestId) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(requests.filter(req => req.id !== requestId));
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Filter by creator
    if (filterCreatorId !== 'all') {
      filtered = filtered.filter(req =>
        (req.creators || []).some(c => String(c.id) === String(filterCreatorId))
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(req => {
        const titleMatch = req.title?.toLowerCase().includes(search);
        const descriptionMatch = req.description?.toLowerCase().includes(search);
        const creatorMatch = (req.creators || []).some(c =>
          c.name?.toLowerCase().includes(search)
        );
        return titleMatch || descriptionMatch || creatorMatch;
      });
    }

    return filtered;
  }, [requests, filterStatus, filterCreatorId, searchTerm]);

  const statusCounts = useMemo(() => {
    return {
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
    };
  }, [requests]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Pending</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{statusCounts.pending}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">In Progress</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{statusCounts.inProgress}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Completed</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{statusCounts.completed}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Cancelled</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-50">{statusCounts.cancelled}</div>
        </div>
      </div>

      {/* Filters and Create Button */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Creator Filter */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Creator:</label>
              <select
                value={filterCreatorId}
                onChange={(e) => setFilterCreatorId(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Creators</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {filterCreatorId !== 'all' && (
                <button
                  onClick={() => setFilterCreatorId('all')}
                  className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRequests.map((request) => (
            <li key={request.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {editingRequestId === request.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                      value={editRequestForm.title}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                      value={editRequestForm.description}
                      onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Creators ({editRequestForm.selectedCreatorIds.length} selected)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-900 space-y-2">
                      {creators.map((c) => (
                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={editRequestForm.selectedCreatorIds.includes(c.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const isChecked = e.target.checked;
                              setEditRequestForm({
                                ...editRequestForm,
                                selectedCreatorIds: isChecked
                                  ? [...editRequestForm.selectedCreatorIds, c.id]
                                  : editRequestForm.selectedCreatorIds.filter(id => id !== c.id)
                              });
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-900 dark:text-gray-50">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                        value={editRequestForm.dueDate}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50"
                        value={editRequestForm.status}
                        onChange={(e) => setEditRequestForm({ ...editRequestForm, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEditRequest}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditRequest}
                      className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-1">
                        {request.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {(request.creators || []).map(c => c.name).join(', ')}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(request.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <button
                      onClick={() => startEditRequest(request)}
                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                      title="Edit request"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRequest(request.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No content requests found.</p>
          </div>
        )}
      </div>

      {/* Content Request Modal */}
      {showModal && (
        <ContentRequestModal
          creators={creators}
          onClose={() => setShowModal(false)}
          onSubmit={(newRequest) => {
            setRequests([...requests, { ...newRequest, id: Date.now() }]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ContentRequests;
