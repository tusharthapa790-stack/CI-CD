from django import forms
from .models import Comment

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('name', 'email', 'body')
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm'}),
            'email': forms.EmailInput(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm'}),
            'body': forms.Textarea(attrs={'class': 'w-full px-3 py-2 border rounded-md shadow-sm', 'rows': 4}),
        }
