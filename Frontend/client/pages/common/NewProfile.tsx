import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Layout } from "@/components/Layout";

export default function Profile() {
    const { user, loadProfile, logout, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        loadProfile();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) {
        return <div className="p-4">Loading profile...</div>;
    }

    const genderLabels = {
        M: 'Male',
        F: 'Female',
        O: 'Other / Non-binary',
        N: 'Prefer not to say',
    };

    return (
        // <Layout>
            <div className="relative overflow-auto w-full min-h-screen flex flex-col gap-6">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-semibold">My Profile</h1>
                        <Button className="bg-red-600" variant="destructive" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input value={user.username} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={`${user.first_name} ${user.last_name}`} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user.email} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Input value={genderLabels[user.gender] || '-'} disabled />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Employee ID</Label>
                                <Input value={user.employee_id} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Employee Type</Label>
                                <Input value={user.employee_type} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Grade</Label>
                                <Input value={user.grade} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Input value={user.department} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Designation</Label>
                                <Input value={user.designation} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input value={user.company} disabled />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Roles & Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Assigned Roles</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {user.roles.map((role) => (
                                        <Badge key={role.name} variant={role.is_primary ? "default" : "secondary"}>
                                            {role.name} {role.is_primary && '(Primary)'}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        // </Layout>
    );
}