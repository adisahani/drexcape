import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  ContactPhone as ContactPhoneIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const PromotionalLeadsSection = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, lead: null });
  const [editForm, setEditForm] = useState({ status: '', notes: '' });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/promotional-leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/promotional-leads/stats', {
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

  const handleEditLead = (lead) => {
    setEditForm({ status: lead.status, notes: lead.notes || '' });
    setEditDialog({ open: true, lead });
  };

  const handleUpdateLead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/promotional-leads/${editDialog.lead._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to update lead');
      
      // Refresh data
      fetchLeads();
      fetchStats();
      setEditDialog({ open: false, lead: null });
    } catch (error) {
      console.error('Error updating lead:', error);
      setError('Failed to update lead');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'primary';
      case 'contacted': return 'warning';
      case 'converted': return 'success';
      case 'lost': return 'error';
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

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading promotional leads...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#ffe066' }}>
        📊 Promotional Leads
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
                <TrendingUpIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.total || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Total Leads
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
                    {stats.new || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    New Leads
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
                <ContactPhoneIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.contacted || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Contacted
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
                <CheckCircleIcon sx={{ color: '#ffe066', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {stats.converted || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffe066' }}>
                    Converted
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leads Table */}
      <Paper sx={{ 
        background: 'linear-gradient(135deg, #1a0033 0%, #3a006a 100%)',
        border: '1px solid rgba(255, 224, 102, 0.3)'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Submitted</TableCell>
                <TableCell sx={{ color: '#ffe066', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead._id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 224, 102, 0.1)' } }}>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: '#ffe066', fontSize: 20 }} />
                      {lead.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ color: '#ffe066', fontSize: 20 }} />
                      {lead.phone}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={lead.status} 
                      color={getStatusColor(lead.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#ffffff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: '#ffe066', fontSize: 20 }} />
                      {formatDate(lead.submittedAt)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Lead">
                      <IconButton 
                        onClick={() => handleEditLead(lead)}
                        sx={{ color: '#ffe066' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, lead: null })}
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
          Edit Lead: {editDialog.lead?.name}
        </DialogTitle>
        <DialogContent sx={{ color: '#ffffff' }}>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
            <Select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
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
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="converted">Converted</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                '& fieldset': {
                  borderColor: 'rgba(255, 224, 102, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: '#ffe066',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffe066',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#ffe066',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialog({ open: false, lead: null })}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateLead}
            sx={{
              background: 'linear-gradient(135deg, #ffe066, #ffd700)',
              color: '#1a0033',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(135deg, #ffd700, #ffe066)',
              }
            }}
          >
            Update Lead
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromotionalLeadsSection; 