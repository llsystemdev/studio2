
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Review } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          'h-5 w-5',
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
        )}
      />
    ))}
  </div>
);

export default function ReviewsPage() {
    const { db, logActivity } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!db) return;
        const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            setReviews(reviewsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviews:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleUpdateStatus = async (reviewId: string, status: 'Approved' | 'Rejected') => {
        if (!db) return;
        const reviewRef = doc(db, 'reviews', reviewId);
        try {
            await updateDoc(reviewRef, { status });
            await logActivity('Update', 'Review', reviewId, `Review status set to ${status}`);
            toast({ title: 'Review Updated', description: `The review has been ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update review status.' });
        }
    };
    
    const handleDelete = async (reviewId: string) => {
        if (!db) return;
        const reviewRef = doc(db, 'reviews', reviewId);
         try {
            await deleteDoc(reviewRef);
            await logActivity('Delete', 'Review', reviewId, `Review has been deleted.`);
            toast({ title: 'Review Deleted' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete review.' });
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusClass = (status: string) => {
        if (status === 'Approved') return 'bg-green-600 hover:bg-green-700';
        return '';
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Review Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>Approve, reject, or delete customer-submitted reviews for vehicles.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>No reviews submitted yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <Card key={review.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className='space-y-2'>
                                            <div className='flex items-center gap-4'>
                                                <span className="font-semibold">{review.customerName}</span>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                                            <p className="text-xs text-muted-foreground">Vehicle ID: {review.vehicleId} | Submitted: {new Date(review.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                             <Badge variant={getStatusVariant(review.status)} className={getStatusClass(review.status)}>
                                                {review.status}
                                            </Badge>
                                            <div className="flex gap-2">
                                                {review.status !== 'Approved' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateStatus(review.id, 'Approved')}>
                                                        <ThumbsUp className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {review.status !== 'Rejected' && (
                                                     <Button size="sm" variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-100 hover:text-yellow-700" onClick={() => handleUpdateStatus(review.id, 'Rejected')}>
                                                        <ThumbsDown className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                 <Button size="sm" variant="destructive" onClick={() => handleDelete(review.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
