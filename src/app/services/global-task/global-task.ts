import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of, switchMap } from 'rxjs';
import { GlobalTask } from '../../models/global-task.model';
import { Comment } from '../../models/comment.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class GlobalTaskService {

  private dbUrl = environment.firebaseConfig.databaseURL;

  constructor(private http: HttpClient) {}


  getGlobalTasks(): Observable<GlobalTask[]> {
    return this.http.get<{ [key: string]: GlobalTask }>(
      `${this.dbUrl}/globalTasks.json`
    ).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({ ...data[key], id: key }));
      })
    );
  }

  getGlobalTask(taskId: string): Observable<GlobalTask> {
    return this.http.get<GlobalTask>(
      `${this.dbUrl}/globalTasks/${taskId}.json`
    ).pipe(
      map(data => ({ ...data, id: taskId }))
    );
  }


  getComments(taskId: string): Observable<Comment[]> {
    return this.http.get<{ [key: string]: Comment }>(
      `${this.dbUrl}/globalTasks/${taskId}/comments.json`
    ).pipe(
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({ ...data[key], id: key }));
      })
    );
  }

 addComment(taskId: string, comment: Omit<Comment, 'id'>): Observable<any> {
  return this.http.post(
    `${this.dbUrl}/globalTasks/${taskId}/comments.json`,
    comment
  ).pipe(
    switchMap((res: any) => {
      return this.http.patch(
        `${this.dbUrl}/users/${comment.userId}/myComments.json`,
        { [res.name]: taskId }
      ).pipe(map(() => res)); 
    })
  );
}

  editComment(taskId: string, commentId: string, text: string): Observable<any> {
    return this.http.patch(
      `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}.json`,
      { text }
    );
  }


deleteComment(taskId: string, commentId: string, commentOwnerId: string): Observable<any> {
   const getSavedBy$ = this.http.get<{ [key: string]: boolean }>(
    `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}/savedBy.json`
  );

  const deleteComment$ = this.http.delete(
    `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}.json`
  );

  const cleanupMy$ = this.http.delete(
    `${this.dbUrl}/users/${commentOwnerId}/myComments/${commentId}.json`
  );

  return forkJoin([getSavedBy$, deleteComment$, cleanupMy$]).pipe(
    switchMap(([savedBy]) => {
      if (!savedBy) return of(null);

      const cleanupSaved$ = Object.keys(savedBy).map(uid =>
        this.http.delete(
          `${this.dbUrl}/users/${uid}/savedComments/${commentId}.json`
        )
      );

      return cleanupSaved$.length > 0 ? forkJoin(cleanupSaved$) : of(null);
    })
  );
}


saveComment(userId: string, commentId: string, taskId: string): Observable<any> {
    const saveRef$ = this.http.patch(
      `${this.dbUrl}/users/${userId}/savedComments.json`,
      { [commentId]: taskId }
    );
    const saveMark$ = this.http.patch(
      `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}/savedBy.json`,
      { [userId]: true }
    );
    return forkJoin([saveRef$, saveMark$]);
}

unsaveComment(userId: string, commentId: string, taskId: string): Observable<any> {

    const removeRef$ = this.http.delete(
      `${this.dbUrl}/users/${userId}/savedComments/${commentId}.json`
    );

    const removeMark$ = this.http.delete(
      `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}/savedBy/${userId}.json`
    );
    return forkJoin([removeRef$, removeMark$]);
  }


  getMyComments(userId: string): Observable<{ comment: Comment; taskId: string; taskTitle: string }[]> {

    return this.http.get<{ [key: string]: string }>(
    `${this.dbUrl}/users/${userId}/myComments.json`
    ).pipe(
      switchMap(refs => {
       if (!refs) return of([]);

      const requests$ = Object.entries(refs).map(([commentId, taskId]) =>
        forkJoin({
          comment: this.http.get<Comment>(
            `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}.json`
          ).pipe(map(data => data ? { ...data, id: commentId } : null)), 
          task: this.getGlobalTask(taskId)
        }).pipe(
          map(({ comment, task }) =>
            comment ? { comment, taskId, taskTitle: task.title } : null
          )
        )
      );

      return forkJoin(requests$).pipe(
        map(results => results.filter(r => r !== null) as
          { comment: Comment; taskId: string; taskTitle: string }[]
        )
      );
    })
  );
}

  getSavedCommentRefs(userId: string): Observable<{ [key: string]: string } | null> {
    return this.http.get<{ [key: string]: string }>(
      `${this.dbUrl}/users/${userId}/savedComments.json`
    );
  }

  getSavedComments( userId: string): Observable<{ comment: Comment; taskId: string; taskTitle: string }[]> {

    return this.getSavedCommentRefs(userId).pipe(
      switchMap(refs => {
        if (!refs) return of([]);

        const requests$ = Object.entries(refs).map(([commentId, taskId]) =>
          forkJoin({
            comment: this.http.get<Comment>(
              `${this.dbUrl}/globalTasks/${taskId}/comments/${commentId}.json`
            ).pipe(map(data => data ? { ...data, id: commentId } : null)),
            task: this.getGlobalTask(taskId)
          }).pipe(
            map(({ comment, task }) =>
              comment
                ? { comment, taskId, taskTitle: task.title }
                : null
            )
          )
        );

        return forkJoin(requests$).pipe(
          map(results =>
            results.filter(r => r !== null) as
              { comment: Comment; taskId: string; taskTitle: string }[]
          )
        );
      })
    );
  }
}