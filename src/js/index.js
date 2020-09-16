import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, removeLoader } from './views/base';

const state = {};

//Search Controller
const controlSearch = async () => {
    //1. Get query from the UI
    const query = searchView.getInput();
    console.log(query); 

    if(query) {
        //2. New seach and add to state
        state.search = new Search(query);

        //3.Prepare ui for results
        searchView.clearInput();
        searchView.clearSearchResults();
        renderLoader(elements.searchRes);

        try{
            //4.Perform a search for recipes
            await state.search.getResults();

            //5.Render the results on the UI
            removeLoader();
            searchView.renderResults(state.search.res);
        } catch(err){ 
            alert(err);
            removeLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click' , e => {
    const btn = e.target.closest('.btn-inline');
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto);
        searchView.clearSearchResults();
        searchView.renderResults(state.search.res, goToPage);
    }
});

//Recipe Controller
const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');

    if(id){        
        //prepare ui for changers
        renderLoader(elements.recipe);
        recipeView.clearRecipe();

        //Highlight the selected recipe
        if(state.search) searchView.highlightSelected(id);

        //create new recipe object
        state.recipe = new Recipe(id);

        try{ 
            //Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //Calculate servings and time taken
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render recipe
            removeLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            )
        } catch(err){
            alert(err);
        }
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));

//List Controller
const controlList = () => {
    //Create a new list
    if(!state.list) state.list = new List();

    //ADd each ingredient to the list and the ui
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        //Delete from the state
        state.list.deleteItem(id);

        //Delete from ui
        listView.deleteItem(id);
    }else if(e.target.matches('.shopping__count-value')){
        //handle couht update
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//Testing



//Like Controller
const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not yet liked the current recipe
    if(!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.image);

        //Toggle like button
        likesView.toggleLikeBtn(true);

        //ADd like to the UI list
        likesView.renderLike(newLike);

    //User has liked the current recipe
    }else { 
        //Remove like from the state
        state.likes.deleteLike(currentID);

        //Toggle the like button
        likesView.toggleLikeBtn(false);

        //Rmove like from the UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikesMenu(state.likes.getNumLikes());
}

//Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikesMenu(state.likes.getNumLikes());

    //Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

//Handling recipe button clicks
elements.recipe.addEventListener('click', e =>{ 
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        //Decrase button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if(e.target.matches('.btn-increase, .btn-increase *')) {
        //INcrease button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')) {
        //Like controller
        controlLike();
    }
});
