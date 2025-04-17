import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, ChevronLeft, Edit2, Save } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Separator } from '@/components/ui/separator';
import config from '@/config';

interface UserProfile {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // For editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/profile`, {
          ...config.defaultFetchOptions,
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setUserProfile(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
        });
      } catch (error) {
        toast.error( 'Failed to load profile data. Please try again later.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/profile/update`, {
        method: 'PUT',
        ...config.defaultFetchOptions,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setUserProfile(prevProfile => ({
        ...prevProfile!,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }));

      setIsEditing(false);
      toast.error('Profile updated successfully',
      );
    } catch (error) {
      toast.error('Failed to update profile. Please try again.',
      );
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch(`${config.apiUrl}/logout`, {
        method: 'POST',
        ...config.defaultFetchOptions,
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      toast.success( 'You have been logged out successfully.', {
        icon: <LogOut className="h-4 w-4" />,
      }
      );
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed. Please try again.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`;
    }
    return userProfile?.email.charAt(0).toUpperCase() || 'U';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/notes')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>

        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Your Profile</CardTitle>
              {!isEditing ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
            <CardDescription>
              Manage your account details and preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt="Profile Picture" />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold">
                  {userProfile?.firstName} {userProfile?.lastName || ''}
                </h2>
                <div className="flex items-center justify-center sm:justify-start mt-2 text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {userProfile?.email}
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="capitalize">
                    {userProfile?.role}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {isEditing ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <Button 
                  className="mt-2" 
                  onClick={handleSaveProfile}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">First Name</Label>
                    <p>{userProfile?.firstName || 'Not set'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Name</Label>
                    <p>{userProfile?.lastName || 'Not set'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Member Since</Label>
                  <p>{userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Unknown'}</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-6">
            <Separator />
            <div className="w-full flex justify-between items-center">
              <div>
                <h3 className="font-medium">Account Actions</h3>
                <p className="text-sm text-muted-foreground">Log out or manage your account</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
