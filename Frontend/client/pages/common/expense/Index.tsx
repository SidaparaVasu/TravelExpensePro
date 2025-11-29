import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

const ExpenseIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Expense Claims Management
          </h1>
          <p className="text-xl text-muted-foreground">
            Submit, track, and manage your travel expense claims efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Submit Claims</h3>
              <p className="text-sm text-muted-foreground">
                Create and submit expense claims with receipts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Track Status</h3>
              <p className="text-sm text-muted-foreground">
                Monitor approval status in real-time
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quick Processing</h3>
              <p className="text-sm text-muted-foreground">
                Fast approval workflow with multiple levels
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Reimbursed</h3>
              <p className="text-sm text-muted-foreground">
                Receive accurate reimbursements quickly
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Button size="lg" onClick={() => navigate('/claims')}>
            View My Claims
          </Button>
          <div>
            <Button variant="outline" size="lg" onClick={() => navigate('/claims/create')}>
              Create New Claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseIndex;
