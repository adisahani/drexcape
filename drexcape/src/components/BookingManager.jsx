import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  ContactPhone as ContactPhoneIcon,
  OpenInNew as OpenInNewIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const BookingManager = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactData, setContactData] = useState({
    method: 'phone',
    notes: '',
    successful: false
  });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.BOOKINGS_ALL}?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings);
        setTotal(data.total);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.BOOKINGS_STATS), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.BOOKING_STATUS(bookingId)), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, adminNotes: notes })
      });

      if (response.ok) {
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleContactAttempt = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.BOOKING_CONTACT(selectedBooking._id)), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        setContactDialogOpen(false);
        setContactData({ method: 'phone', notes: '', successful: false });
        fetchBookings();
      }
    } catch (error) {
      console.error('Error recording contact attempt:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'contacted': return 'info';
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'contacted': return <ContactPhoneIcon />;
      case 'confirmed': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      case 'completed': return <CheckCircleIcon />;
      default: return <PendingIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const handleEmail = (email) => {
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  };

  const handleWhatsApp = (phone) => {
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          color: '#2a0140', 
          fontWeight: 700, 
          mb: 2,
          fontFamily: 'Rajdhani, sans-serif'
        }}>
          📦 Booking Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Manage package booking requests and track customer interactions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.totalBookings || 0}
                  </Typography>
                  <Typography variant="body2">Total Bookings</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.pendingBookings || 0}
                  </Typography>
                  <Typography variant="body2">Pending</Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.contactedBookings || 0}
                  </Typography>
                  <Typography variant="body2">Contacted</Typography>
                </Box>
                <ContactPhoneIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.confirmedBookings || 0}
                  </Typography>
                  <Typography variant="body2">Confirmed</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Showing {bookings.length} of {total} bookings
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Package</strong></TableCell>
              <TableCell><strong>Travelers</strong></TableCell>
              <TableCell><strong>Travel Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {booking.customerInfo.fullName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {booking.customerInfo.phone}
                    </Typography>
                    {booking.customerInfo.email && (
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {booking.customerInfo.email}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {booking.packageTitle}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      ₹{booking.packagePrice.toLocaleString()}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => window.open(`/package/${booking.packageSlug}`, '_blank')}
                      sx={{ mt: 1 }}
                    >
                      View Package
                    </Button>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ fontSize: 16 }} />
                    <Typography>{booking.customerInfo.travelers}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16 }} />
                    <Typography variant="body2">
                      {new Date(booking.customerInfo.preferredDate).toLocaleDateString('en-IN')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(booking.status)}
                    label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(booking.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Call Customer">
                      <IconButton
                        size="small"
                        onClick={() => handleCall(booking.customerInfo.phone)}
                        sx={{ color: '#4caf50' }}
                      >
                        <PhoneIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {booking.customerInfo.email && (
                      <Tooltip title="Send Email">
                        <IconButton
                          size="small"
                          onClick={() => handleEmail(booking.customerInfo.email)}
                          sx={{ color: '#2196f3' }}
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="WhatsApp">
                      <IconButton
                        size="small"
                        onClick={() => handleWhatsApp(booking.customerInfo.phone)}
                        sx={{ color: '#25d366' }}
                      >
                        <WhatsAppIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Record Contact">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setContactDialogOpen(true);
                        }}
                        sx={{ color: '#ff9800' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Booking Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
          color: 'white',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600
        }}>
          Booking Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: '#2a0140' }}>
                  Customer Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Name" 
                      secondary={selectedBooking.customerInfo.fullName} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Phone" 
                      secondary={selectedBooking.customerInfo.phone} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={selectedBooking.customerInfo.email || 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Travelers" 
                      secondary={selectedBooking.customerInfo.travelers} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Preferred Date" 
                      secondary={new Date(selectedBooking.customerInfo.preferredDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: '#2a0140' }}>
                  Package Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Package" 
                      secondary={selectedBooking.packageTitle} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Price" 
                      secondary={`₹${selectedBooking.packagePrice.toLocaleString()}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        <Chip
                          label={selectedBooking.status}
                          color={getStatusColor(selectedBooking.status)}
                          size="small"
                        />
                      } 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Created" 
                      secondary={formatDate(selectedBooking.createdAt)} 
                    />
                  </ListItem>
                </List>
                
                {selectedBooking.customerInfo.specialRequests && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: '#2a0140' }}>
                      Special Requests
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      fontStyle: 'italic'
                    }}>
                      {selectedBooking.customerInfo.specialRequests}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              {selectedBooking.contactAttempts && selectedBooking.contactAttempts.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, color: '#2a0140' }}>
                    Contact History
                  </Typography>
                  <List dense>
                    {selectedBooking.contactAttempts.map((attempt, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {attempt.method === 'phone' && <PhoneIcon />}
                          {attempt.method === 'email' && <EmailIcon />}
                          {attempt.method === 'whatsapp' && <WhatsAppIcon />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${attempt.method.charAt(0).toUpperCase() + attempt.method.slice(1)} - ${attempt.successful ? 'Successful' : 'Unsuccessful'}`}
                          secondary={`${formatDate(attempt.date)} - ${attempt.notes}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Attempt Dialog */}
      <Dialog 
        open={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
          color: 'white',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600
        }}>
          Record Contact Attempt
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Contact Method</InputLabel>
                <Select
                  value={contactData.method}
                  onChange={(e) => setContactData({...contactData, method: e.target.value})}
                  label="Contact Method"
                >
                  <MenuItem value="phone">Phone Call</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={contactData.notes}
                onChange={(e) => setContactData({...contactData, notes: e.target.value})}
                placeholder="Describe the contact attempt and any important details..."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Was the contact successful?</InputLabel>
                <Select
                  value={contactData.successful}
                  onChange={(e) => setContactData({...contactData, successful: e.target.value})}
                  label="Was the contact successful?"
                >
                  <MenuItem value={true}>Yes - Contacted successfully</MenuItem>
                  <MenuItem value={false}>No - Could not reach</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setContactDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleContactAttempt}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6d3bbd 0%, #a084e8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #a084e8 0%, #6d3bbd 100%)',
              }
            }}
          >
            Record Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingManager;
