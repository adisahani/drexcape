import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  DeviceHub as DeviceIcon
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const ActivityTrackerSection = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    activityType: 'all',
    dateRange: '7d',
    deviceType: 'all'
  });
  const [exportDialog, setExportDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchActivities();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    fetchActivities();
  }, [currentPage]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        type: filters.activityType,
        range: filters.dateRange,
        device: filters.deviceType,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ANALYTICS_ACTIVITY_FEED}?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json();
      setActivities(data.activities || []);
      setTotalActivities(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ANALYTICS_DASHBOARD), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'search': return <SearchIcon />;
      case 'form_submission': return <PersonIcon />;
      case 'itinerary_view': return <VisibilityIcon />;
      case 'itinerary_share': return <ShareIcon />;
      case 'error': return <ErrorIcon />;
      case 'page_view': return <TimelineIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'search': return 'primary';
      case 'form_submission': return 'success';
      case 'itinerary_view': return 'info';
      case 'itinerary_share': return 'warning';
      case 'error': return 'error';
      case 'page_view': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ANALYTICS_EXPORT), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportDialog(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading activity data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#ffe066' }}>
        📊 Activity Tracker
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '1px solid rgba(255, 224, 102, 0.3)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SearchIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.totalSearches || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Total Searches
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '1px solid rgba(255, 224, 102, 0.3)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.totalSubmissions || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Form Submissions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '1px solid rgba(255, 224, 102, 0.3)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VisibilityIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.totalViews || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Itinerary Views
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '1px solid rgba(255, 224, 102, 0.3)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DeviceIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.uniqueUsers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Total Users
                  </Typography>
                  {stats.identifiedUsers !== undefined && (
                    <Typography variant="caption" sx={{ color: '#ffe066', opacity: 0.8 }}>
                      {stats.identifiedUsers} identified, {stats.anonymousUsers || 0} anonymous
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterDialog(true)}
          sx={{
            color: '#ffe066',
            borderColor: '#ffe066',
            '&:hover': {
              borderColor: '#ffd700',
              backgroundColor: 'rgba(255, 224, 102, 0.1)'
            }
          }}
        >
          Filter
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => setExportDialog(true)}
          sx={{
            color: '#ffe066',
            borderColor: '#ffe066',
            '&:hover': {
              borderColor: '#ffd700',
              backgroundColor: 'rgba(255, 224, 102, 0.1)'
            }
          }}
        >
          Export Data
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setLoading(true);
            fetchActivities();
            fetchStats();
          }}
          sx={{
            color: '#ffe066',
            borderColor: '#ffe066',
            '&:hover': {
              borderColor: '#ffd700',
              backgroundColor: 'rgba(255, 224, 102, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Activities Table */}
      <Paper sx={{ 
        background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
        border: '1px solid rgba(255, 224, 102, 0.3)'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Activity</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>User</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Device</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Details</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Time</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity._id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 224, 102, 0.1)' } }}>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActivityIcon(activity.activityType)}
                      <Chip 
                        label={activity.activityType.replace('_', ' ')} 
                        color={getActivityColor(activity.activityType)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {activity.userInfo?.name || (activity.userId === 'anonymous' ? 'Anonymous User' : 'Unknown User')}
                      </Typography>
                      {activity.userInfo?.phone && activity.userInfo.phone !== 'N/A' && (
                        <Typography variant="caption" sx={{ color: '#ffe066' }}>
                          {activity.userInfo.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DeviceIcon sx={{ color: '#ffe066', fontSize: 16 }} />
                      {activity.deviceInfo?.deviceType || 'Unknown'}
                    </Box>
                  </TableCell>
                                     <TableCell sx={{ color: '#ffffff' }}>
                     {activity.searchData && (
                       <Box>
                         <Typography variant="body2" sx={{ mb: 0.5 }}>
                           {activity.searchData.from} → {activity.searchData.to}
                         </Typography>
                         {activity.searchData.priceRange && (
                           <Typography variant="caption" sx={{ color: '#ffe066', display: 'block' }}>
                             💰 ₹{activity.searchData.priceRange.min?.toLocaleString()} - ₹{activity.searchData.priceRange.max?.toLocaleString()}
                           </Typography>
                         )}
                         {activity.searchData.travellers && (
                           <Typography variant="caption" sx={{ color: '#a084e8', display: 'block' }}>
                             👥 {activity.searchData.travellers} traveller{activity.searchData.travellers > 1 ? 's' : ''}
                           </Typography>
                         )}
                       </Box>
                     )}
                     {activity.formData && (
                       <Typography variant="body2">
                         {activity.formData.fields?.name} ({activity.formData.fields?.phone})
                       </Typography>
                     )}
                     {activity.itineraryData && (
                                               <Tooltip title="Click to view itinerary (opens in new tab)" arrow>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              cursor: 'pointer',
                              color: '#ffe066',
                              textDecoration: 'underline',
                              '&:hover': {
                                color: '#ffd700',
                                textDecoration: 'none'
                              }
                            }}
                            onClick={() => window.open(`/itinerary/${activity.itineraryData.itinerarySlug}`, '_blank')}
                          >
                            {activity.itineraryData.itinerarySlug}
                          </Typography>
                        </Tooltip>
                     )}
                     {activity.pageData && (
                       <Typography variant="body2">
                         {activity.pageData.pageTitle}
                       </Typography>
                     )}
                   </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon sx={{ color: '#ffe066', fontSize: 16 }} />
                      {formatDate(activity.timestamp)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    {activity.searchData?.processingTime ? 
                      `${activity.searchData.processingTime}ms` : 
                      activity.itineraryData?.viewDuration ? 
                      formatDuration(activity.itineraryData.viewDuration) : 
                      '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                 </TableContainer>
       </Paper>

       {/* Pagination Controls */}
       {totalPages > 1 && (
         <Box sx={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center', 
           mt: 3,
           p: 2,
           background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
           border: '1px solid rgba(255, 224, 102, 0.3)',
           borderRadius: 1
         }}>
           <Typography variant="body2" sx={{ color: '#ffe066' }}>
             Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalActivities)} of {totalActivities} activities
           </Typography>
           
           <Box sx={{ display: 'flex', gap: 1 }}>
             <Button
               variant="outlined"
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               sx={{
                 color: '#ffe066',
                 borderColor: '#ffe066',
                 '&:hover': {
                   borderColor: '#ffd700',
                   backgroundColor: 'rgba(255, 224, 102, 0.1)'
                 },
                 '&:disabled': {
                   color: 'rgba(255, 224, 102, 0.3)',
                   borderColor: 'rgba(255, 224, 102, 0.3)'
                 }
               }}
             >
               Previous
             </Button>
             
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                 const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                 return (
                   <Button
                     key={pageNum}
                     variant={currentPage === pageNum ? "contained" : "outlined"}
                     onClick={() => setCurrentPage(pageNum)}
                     sx={{
                       minWidth: '40px',
                       height: '40px',
                       color: currentPage === pageNum ? '#1a0033' : '#ffe066',
                       backgroundColor: currentPage === pageNum ? '#ffe066' : 'transparent',
                       borderColor: '#ffe066',
                       '&:hover': {
                         backgroundColor: currentPage === pageNum ? '#ffd700' : 'rgba(255, 224, 102, 0.1)',
                         borderColor: '#ffd700'
                       }
                     }}
                   >
                     {pageNum}
                   </Button>
                 );
               })}
             </Box>
             
             <Button
               variant="outlined"
               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
               disabled={currentPage === totalPages}
               sx={{
                 color: '#ffe066',
                 borderColor: '#ffe066',
                 '&:hover': {
                   borderColor: '#ffd700',
                   backgroundColor: 'rgba(255, 224, 102, 0.1)'
                 },
                 '&:disabled': {
                   color: 'rgba(255, 224, 102, 0.3)',
                   borderColor: 'rgba(255, 224, 102, 0.3)'
                 }
               }}
             >
               Next
             </Button>
           </Box>
         </Box>
       )}

      {/* Filter Dialog */}
      <Dialog 
        open={filterDialog} 
        onClose={() => setFilterDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '2px solid rgba(255, 224, 102, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffe066' }}>
          Filter Activities
        </DialogTitle>
        <DialogContent sx={{ color: '#ffffff' }}>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Activity Type</InputLabel>
            <Select
              value={filters.activityType}
              onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}
              sx={{
                color: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 224, 102, 0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
              }}
            >
              <MenuItem value="all">All Activities</MenuItem>
              <MenuItem value="search">Searches</MenuItem>
              <MenuItem value="form_submission">Form Submissions</MenuItem>
              <MenuItem value="itinerary_view">Itinerary Views</MenuItem>
              <MenuItem value="itinerary_share">Itinerary Shares</MenuItem>
              <MenuItem value="error">Errors</MenuItem>
              <MenuItem value="page_view">Page Views</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              sx={{
                color: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 224, 102, 0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
              }}
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Device Type</InputLabel>
            <Select
              value={filters.deviceType}
              onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
              sx={{
                color: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 224, 102, 0.5)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ffe066',
                },
              }}
            >
              <MenuItem value="all">All Devices</MenuItem>
              <MenuItem value="desktop">Desktop</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="tablet">Tablet</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFilterDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setFilterDialog(false)}
            sx={{
              background: 'linear-gradient(135deg, #ffe066, #ffd700)',
              color: '#1a0033',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(135deg, #ffd700, #ffe066)',
              }
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialog} 
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
            border: '2px solid rgba(255, 224, 102, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffe066' }}>
          Export Activity Data
        </DialogTitle>
        <DialogContent sx={{ color: '#ffffff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Export all activity data as a CSV file. This will include:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>• User search activities</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• Form submissions</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• Itinerary views and shares</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• Error tracking data</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>• Device and location information</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setExportDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            sx={{
              background: 'linear-gradient(135deg, #ffe066, #ffd700)',
              color: '#1a0033',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(135deg, #ffd700, #ffe066)',
              }
            }}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActivityTrackerSection; 